import {
  createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  collection, doc, onSnapshot, setDoc, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  DATES as DATES_DEFAULT, N_ROUNDS, PLAYERS_INITIAL, SEASON_NAME,
} from '../data/fixedData';
import {
  emptyWeekData, generateGroupAssignment, normalizeWeekData, randomAvailableRound,
} from '../data/domain';
import type { KnockoutKey, WeekData, WeeksMap } from '../data/types';

interface SeasonContextValue {
  seasonName: string;
  players: string[];
  dates: string[];
  weeks: WeeksMap;
  loading: boolean;
  canEdit: boolean;
  savePlayers: (players: string[]) => Promise<void>;
  setAssignedRound: (week: number, sorteioNo: number | null) => Promise<void>;
  sortearTodasAsRodadas: () => Promise<void>;
  setGroupScore: (week: number, group: 'A' | 'B', gameIdx: number, side: 'h' | 'a', value: string) => Promise<void>;
  setKnockoutScore: (week: number, key: KnockoutKey, side: 'h' | 'a', value: string) => Promise<void>;
  setPlayerOverride: (week: number, playerNum: number, value: string, canonicalName: string) => Promise<void>;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

function defaultWeeksMap(): WeeksMap {
  const map: WeeksMap = {};
  for (let r = 1; r <= N_ROUNDS; r++) map[r] = emptyWeekData();
  return map;
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [seasonName, setSeasonName] = useState(SEASON_NAME);
  const [players, setPlayers] = useState<string[]>(PLAYERS_INITIAL);
  const [dates] = useState<string[]>(DATES_DEFAULT);
  const [weeks, setWeeks] = useState<WeeksMap>(defaultWeeksMap());
  const [seasonLoaded, setSeasonLoaded] = useState(false);
  const [weeksLoaded, setWeeksLoaded] = useState(false);

  const weeksRef = useRef(weeks);
  weeksRef.current = weeks;
  const writeTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!db) { setSeasonLoaded(true); setWeeksLoaded(true); return; }

    const unsubs: Unsubscribe[] = [];

    unsubs.push(onSnapshot(doc(db, 'config', 'season'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { nome?: string; players?: string[]; dates?: string[] };
        if (data.nome) setSeasonName(data.nome);
        if (Array.isArray(data.players) && data.players.length === PLAYERS_INITIAL.length) setPlayers(data.players);
      }
      setSeasonLoaded(true);
    }));

    unsubs.push(onSnapshot(collection(db, 'weeks'), (snap) => {
      setWeeks((prev) => {
        const next: WeeksMap = { ...defaultWeeksMap(), ...prev };
        snap.docs.forEach((d) => {
          const w = Number(d.id);
          if (w >= 1 && w <= N_ROUNDS) next[w] = normalizeWeekData(d.data() as Partial<WeekData>);
        });
        return next;
      });
      setWeeksLoaded(true);
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  async function writeWeek(week: number, data: WeekData) {
    if (!db) return;
    await setDoc(doc(db, 'weeks', String(week)), data);
  }

  // Digitação (placar, suplentes) é comitada com um pequeno debounce por
  // semana para não gerar uma escrita no Firestore a cada tecla digitada.
  function scheduleWriteWeek(week: number, data: WeekData) {
    if (writeTimers.current[week]) clearTimeout(writeTimers.current[week]);
    writeTimers.current[week] = setTimeout(() => {
      delete writeTimers.current[week];
      void writeWeek(week, data);
    }, 450);
  }

  async function savePlayers(newPlayers: string[]) {
    setPlayers(newPlayers);
    if (!db) return;
    await setDoc(doc(db, 'config', 'season'), { nome: seasonName, players: newPlayers, dates }, { merge: true });
  }

  // Sortear (ou re-sortear) a rodada da semana muda qual dupla cai em qual
  // posição dos grupos — os placares e o mata-mata já lançados ficam
  // amarrados à dupla errada se não forem zerados junto. Por isso
  // groupScores/knockout sempre voltam limpos aqui, mesmo ao re-selecionar
  // o mesmo Sorteio nº (o sorteio dos grupos A/B é sempre novo).
  async function setAssignedRound(week: number, sorteioNo: number | null) {
    const current = normalizeWeekData(weeksRef.current[week]);
    const fresh = emptyWeekData();
    const next: WeekData = {
      ...current,
      assignedRound: sorteioNo,
      groupAssignment: sorteioNo ? generateGroupAssignment() : null,
      groupScores: fresh.groupScores,
      knockout: fresh.knockout,
    };
    setWeeks((prev) => ({ ...prev, [week]: next }));
    await writeWeek(week, next);
  }

  async function sortearTodasAsRodadas() {
    let snapshot = weeksRef.current;
    for (let w = 1; w <= N_ROUNDS; w++) {
      if (snapshot[w]?.assignedRound) continue;
      const pick = randomAvailableRound(snapshot, w);
      if (pick === null) break;
      const fresh = emptyWeekData();
      const next: WeekData = {
        ...normalizeWeekData(snapshot[w]),
        assignedRound: pick,
        groupAssignment: generateGroupAssignment(),
        groupScores: fresh.groupScores,
        knockout: fresh.knockout,
      };
      snapshot = { ...snapshot, [w]: next };
      setWeeks(snapshot);
      weeksRef.current = snapshot;
      await writeWeek(w, next);
    }
  }

  async function setGroupScore(week: number, group: 'A' | 'B', gameIdx: number, side: 'h' | 'a', value: string) {
    const current = normalizeWeekData(weeksRef.current[week]);
    const groupScores = {
      ...current.groupScores,
      [group]: current.groupScores[group].map((m, i) => (i === gameIdx ? { ...m, [side]: value } : m)),
    };
    const next: WeekData = { ...current, groupScores };
    setWeeks((prev) => ({ ...prev, [week]: next }));
    weeksRef.current = { ...weeksRef.current, [week]: next };
    scheduleWriteWeek(week, next);
  }

  async function setKnockoutScore(week: number, key: KnockoutKey, side: 'h' | 'a', value: string) {
    const current = normalizeWeekData(weeksRef.current[week]);
    const next: WeekData = {
      ...current,
      knockout: { ...current.knockout, [key]: { ...current.knockout[key], [side]: value } },
    };
    setWeeks((prev) => ({ ...prev, [week]: next }));
    weeksRef.current = { ...weeksRef.current, [week]: next };
    scheduleWriteWeek(week, next);
  }

  async function setPlayerOverride(week: number, playerNum: number, value: string, canonicalName: string) {
    const current = normalizeWeekData(weeksRef.current[week]);
    const isOverride = Boolean(value.trim() && value.trim() !== canonicalName);
    const playerOverrides = { ...current.playerOverrides };
    if (isOverride) playerOverrides[playerNum] = value;
    else delete playerOverrides[playerNum];
    const next: WeekData = { ...current, playerOverrides };
    setWeeks((prev) => ({ ...prev, [week]: next }));
    weeksRef.current = { ...weeksRef.current, [week]: next };
    scheduleWriteWeek(week, next);
  }

  const value = useMemo<SeasonContextValue>(() => ({
    seasonName,
    players,
    dates,
    weeks,
    loading: !seasonLoaded || !weeksLoaded,
    canEdit: isAdmin,
    savePlayers,
    setAssignedRound,
    sortearTodasAsRodadas,
    setGroupScore,
    setKnockoutScore,
    setPlayerOverride,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [seasonName, players, dates, weeks, seasonLoaded, weeksLoaded, isAdmin]);

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeason(): SeasonContextValue {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason deve ser usado dentro de SeasonProvider');
  return ctx;
}
