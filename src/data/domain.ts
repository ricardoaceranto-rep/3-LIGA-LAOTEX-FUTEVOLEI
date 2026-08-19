// Lógica de negócio pura, portada 1:1 do protótipo HTML de referência.
// Todas as funções recebem o estado explicitamente (nada de globais) para
// poderem ser alimentadas tanto pelos dados do Firestore quanto em testes.

import {
  GROUPS, MATCH_PATTERN, N_PLAYERS, N_ROUNDS, PONTOS_CAMPEAO_OURO, PONTOS_CAMPEAO_PRATA,
  PONTOS_QUARTO_OURO, PONTOS_QUARTO_PRATA, PONTOS_TERCEIRO_OURO, PONTOS_TERCEIRO_PRATA,
  PONTOS_VICE_OURO, PONTOS_VICE_PRATA, PTS_VITORIA, ROUNDS, MESES,
} from './fixedData';
import type { GroupKey } from './fixedData';
import type {
  GroupAssignment, GroupStandingRow, Knockout, KnockoutKey, MatchScore,
  RankingRow, RoundStatus, WeekData, WeeksMap,
} from './types';

export function emptyMatchScore(): MatchScore {
  return { h: '', a: '' };
}

export function emptyWeekData(): WeekData {
  return {
    assignedRound: null,
    groupAssignment: null,
    groupScores: {
      A: Array.from({ length: 6 }, emptyMatchScore),
      B: Array.from({ length: 6 }, emptyMatchScore),
    },
    knockout: {
      sfG1: emptyMatchScore(), sfG2: emptyMatchScore(), thirdG: emptyMatchScore(), finalG: emptyMatchScore(),
      sfS1: emptyMatchScore(), sfS2: emptyMatchScore(), thirdS: emptyMatchScore(), finalS: emptyMatchScore(),
    },
    playerOverrides: {},
  };
}

// Preenche com valores padrão qualquer campo ausente num documento vindo do
// Firestore — em especial os jogos de knockout adicionados depois que a
// rodada já existia (ex.: thirdG/thirdS da Disputa de 3º Lugar). Sem isso,
// uma rodada salva antes desses campos existirem chega com
// `knockout.thirdG === undefined`, e qualquer leitura de `.h`/`.a` quebra.
// Sempre usar esta função (nunca o dado cru do Firestore) como fonte de
// WeekData no app.
export function normalizeWeekData(raw: Partial<WeekData> | undefined | null): WeekData {
  const base = emptyWeekData();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    groupScores: {
      A: raw.groupScores?.A ?? base.groupScores.A,
      B: raw.groupScores?.B ?? base.groupScores.B,
    },
    knockout: { ...base.knockout, ...raw.knockout },
    playerOverrides: raw.playerOverrides ?? base.playerOverrides,
  };
}

export function playerName(players: string[], num: number): string {
  const nm = players[num - 1];
  return nm && nm.trim() ? nm.trim() : `Jogador ${num}`;
}

export function roundPlayerName(week: WeekData | undefined, players: string[], num: number): string {
  const ov = week?.playerOverrides?.[num];
  return ov && String(ov).trim() ? String(ov).trim() : playerName(players, num);
}

export function duplaLabelByPair(pair: [number, number], week: WeekData | undefined, players: string[]): string {
  if (week) {
    return `${roundPlayerName(week, players, pair[0])} / ${roundPlayerName(week, players, pair[1])}`;
  }
  return `${playerName(players, pair[0])} / ${playerName(players, pair[1])}`;
}

export function duplaOfRoundLocal(assignedRound: number | null | undefined, duplaNo: number): [number, number] | null {
  if (!assignedRound) return null;
  const pair = ROUNDS[assignedRound - 1][duplaNo - 1];
  return pair ? [pair[0], pair[1]] : null;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `Segunda-feira, ${d} de ${MESES[m - 1]} de ${y}`;
}

export function num(v: string | number | null | undefined): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/* ---- Sorteio: qual rodada (Sorteio nº 1-15) é jogada em cada semana ---- */
export function usedRounds(weeks: WeeksMap, excludeWeek?: number): Set<number> {
  const s = new Set<number>();
  for (let w = 1; w <= N_ROUNDS; w++) {
    if (w === excludeWeek) continue;
    const ar = weeks[w]?.assignedRound;
    if (ar) s.add(ar);
  }
  return s;
}

export function availableRoundsFor(weeks: WeeksMap, week: number): number[] {
  const used = usedRounds(weeks, week);
  const opts: number[] = [];
  for (let s = 1; s <= N_ROUNDS; s++) if (!used.has(s)) opts.push(s);
  return opts;
}

export function randomAvailableRound(weeks: WeeksMap, excludeWeek: number): number | null {
  const opts = availableRoundsFor(weeks, excludeWeek);
  if (opts.length === 0) return null;
  return opts[Math.floor(Math.random() * opts.length)];
}

// Sorteia de novo (aleatoriamente) quais das 8 duplas caem no Grupo A e quais no Grupo B
export function generateGroupAssignment(): GroupAssignment {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return {
    A: nums.slice(0, 4).sort((a, b) => a - b),
    B: nums.slice(4, 8).sort((a, b) => a - b),
  };
}

export function duplasDoGrupo(week: WeekData | undefined, group: GroupKey): number[] {
  const ga = week?.groupAssignment;
  if (ga && ga[group]) return ga[group];
  const idxBase = group === 'A' ? 0 : 4;
  return [idxBase + 1, idxBase + 2, idxBase + 3, idxBase + 4];
}

// Classificação de um grupo de 4 duplas (todos x todos, turno único)
export function computeGroupStandings(week: WeekData | undefined, group: GroupKey): GroupStandingRow[] {
  const duplasGlobais = duplasDoGrupo(week, group);
  const games = week?.groupScores?.[group] ?? Array.from({ length: 6 }, emptyMatchScore);
  const stats = duplasGlobais.map(() => ({ jogos: 0, v: 0, d: 0, pf: 0, pc: 0 }));
  MATCH_PATTERN.forEach((pat, i) => {
    const [hLocal, aLocal] = pat;
    const g = games[i];
    const h = num(g.h);
    const a = num(g.a);
    if (h === null || a === null) return;
    stats[hLocal].jogos++;
    stats[aLocal].jogos++;
    stats[hLocal].pf += h;
    stats[hLocal].pc += a;
    stats[aLocal].pf += a;
    stats[aLocal].pc += h;
    if (h > a) { stats[hLocal].v++; stats[aLocal].d++; }
    else if (a > h) { stats[aLocal].v++; stats[hLocal].d++; }
  });
  const rows: GroupStandingRow[] = duplasGlobais.map((dg, i) => ({
    duplaNo: dg,
    group,
    jogos: stats[i].jogos,
    v: stats[i].v,
    d: stats[i].d,
    pf: stats[i].pf,
    pc: stats[i].pc,
    saldo: stats[i].pf - stats[i].pc,
    pts: stats[i].v * PTS_VITORIA,
    pos: 0,
  }));
  rows.sort((x, y) => (y.pts - x.pts) || (y.saldo - x.saldo) || (y.pf - x.pf) || (x.duplaNo - y.duplaNo));
  rows.forEach((row, i) => { row.pos = i + 1; });
  return rows;
}

export function groupPosMap(week: WeekData | undefined, group: GroupKey): Record<number, GroupStandingRow> {
  const rows = computeGroupStandings(week, group);
  const map: Record<number, GroupStandingRow> = {};
  rows.forEach((r) => { map[r.pos] = r; });
  return map;
}

// Aceita undefined de propósito: dados antigos do Firestore podem não ter
// ainda o campo de um jogo (ex.: thirdG/thirdS), e essa função é chamada
// direto com `week.knockout[key]` em alguns lugares — sem essa checagem,
// um campo ausente quebra a leitura de `.h`.
export function isDecisive(s: MatchScore | undefined | null): boolean {
  if (!s) return false;
  const h = num(s.h);
  const a = num(s.a);
  return h !== null && a !== null && h !== a;
}

export function roundStatus(week: WeekData | undefined): RoundStatus {
  if (!week?.assignedRound) return 'undrawn';
  const groupScores = week.groupScores ?? { A: [], B: [] };
  const knockout = week.knockout ?? ({} as Partial<Knockout>);
  const anyGroupScore = GROUPS.some((g) => (groupScores[g] ?? []).some((m) => m?.h !== '' && m?.a !== ''));
  const anyKo = Object.values(knockout).some((k) => k && (k.h !== '' || k.a !== ''));
  const allPlacementsDone = (['finalG', 'thirdG', 'finalS', 'thirdS'] as const)
    .every((key) => isDecisive(knockout[key]));
  if (allPlacementsDone) return 'done';
  if (anyGroupScore || anyKo) return 'progress';
  return 'upcoming';
}

export function winnerOf(week: WeekData | undefined, key: KnockoutKey, duplaA: number | null, duplaB: number | null): number | null {
  const s = week?.knockout?.[key];
  if (!s) return null;
  const h = num(s.h);
  const a = num(s.a);
  if (h === null || a === null || h === a) return null;
  return h > a ? duplaA : duplaB;
}

export function loserOf(week: WeekData | undefined, key: KnockoutKey, duplaA: number | null, duplaB: number | null): number | null {
  const winner = winnerOf(week, key, duplaA, duplaB);
  if (winner === null) return null;
  return winner === duplaA ? duplaB : duplaA;
}

export interface KoTeams {
  sfG1: [GroupStandingRow, GroupStandingRow];
  sfG2: [GroupStandingRow, GroupStandingRow];
  sfS1: [GroupStandingRow, GroupStandingRow];
  sfS2: [GroupStandingRow, GroupStandingRow];
}

export function koTeamsForRound(week: WeekData | undefined): KoTeams {
  const posA = groupPosMap(week, 'A');
  const posB = groupPosMap(week, 'B');
  return {
    sfG1: [posA[1], posB[2]],
    sfG2: [posA[2], posB[1]],
    sfS1: [posA[3], posB[4]],
    sfS2: [posA[4], posB[3]],
  };
}

export function championsOfRound(week: WeekData | undefined): { ouro: [number, number] | null; prata: [number, number] | null } {
  if (!week?.assignedRound) return { ouro: null, prata: null };
  const teams = koTeamsForRound(week);

  const wG1 = winnerOf(week, 'sfG1', teams.sfG1[0].duplaNo, teams.sfG1[1].duplaNo);
  const wG2 = winnerOf(week, 'sfG2', teams.sfG2[0].duplaNo, teams.sfG2[1].duplaNo);
  let ouro: [number, number] | null = null;
  if (wG1 !== null && wG2 !== null) {
    const w = winnerOf(week, 'finalG', wG1, wG2);
    if (w !== null) ouro = duplaOfRoundLocal(week.assignedRound, w);
  }

  const wS1 = winnerOf(week, 'sfS1', teams.sfS1[0].duplaNo, teams.sfS1[1].duplaNo);
  const wS2 = winnerOf(week, 'sfS2', teams.sfS2[0].duplaNo, teams.sfS2[1].duplaNo);
  let prata: [number, number] | null = null;
  if (wS1 !== null && wS2 !== null) {
    const w = winnerOf(week, 'finalS', wS1, wS2);
    if (w !== null) prata = duplaOfRoundLocal(week.assignedRound, w);
  }

  return { ouro, prata };
}

/* ---- Pontuação individual (ranking geral da temporada) ----
 * Suplente/ausente não pontuam: se o admin registrou um suplente para um
 * jogador naquela semana (playerOverrides), esse número de jogador titular
 * fica de fora do ranking daquela rodada — o outro titular da dupla
 * continua pontuando normalmente. Isso é checado por jogador, não por
 * dupla: os dois membros de uma mesma dupla podem receber pontuações
 * diferentes na mesma rodada. */
function playerAusente(week: WeekData, playerNum: number): boolean {
  return Boolean(week.playerOverrides?.[playerNum]?.trim());
}

function addPontosDupla(week: WeekData, duplaNo: number | null, pts: number, totals: number[]): void {
  if (duplaNo === null || duplaNo === undefined) return;
  const pair = duplaOfRoundLocal(week.assignedRound, duplaNo);
  if (!pair) return;
  pair.forEach((playerNum) => {
    if (!playerAusente(week, playerNum)) totals[playerNum] += pts;
  });
}

export function computeRankingGeral(players: string[], weeks: WeeksMap): RankingRow[] {
  const totals = Array(N_PLAYERS + 1).fill(0);
  for (let r = 1; r <= N_ROUNDS; r++) {
    const week = weeks[r];
    if (!week?.assignedRound) continue;
    const teams = koTeamsForRound(week);

    const wG1 = winnerOf(week, 'sfG1', teams.sfG1[0].duplaNo, teams.sfG1[1].duplaNo);
    const wG2 = winnerOf(week, 'sfG2', teams.sfG2[0].duplaNo, teams.sfG2[1].duplaNo);
    const lG1 = loserOf(week, 'sfG1', teams.sfG1[0].duplaNo, teams.sfG1[1].duplaNo);
    const lG2 = loserOf(week, 'sfG2', teams.sfG2[0].duplaNo, teams.sfG2[1].duplaNo);

    if (wG1 !== null && wG2 !== null) {
      const finalW = winnerOf(week, 'finalG', wG1, wG2);
      if (finalW !== null) {
        const finalL = finalW === wG1 ? wG2 : wG1;
        addPontosDupla(week, finalW, PONTOS_CAMPEAO_OURO, totals);
        addPontosDupla(week, finalL, PONTOS_VICE_OURO, totals);
      }
    }
    // 3º/4º da Série Ouro = disputa entre as perdedoras das semifinais
    if (lG1 !== null && lG2 !== null) {
      const thirdW = winnerOf(week, 'thirdG', lG1, lG2);
      if (thirdW !== null) {
        const thirdL = thirdW === lG1 ? lG2 : lG1;
        addPontosDupla(week, thirdW, PONTOS_TERCEIRO_OURO, totals);
        addPontosDupla(week, thirdL, PONTOS_QUARTO_OURO, totals);
      }
    }

    const wS1 = winnerOf(week, 'sfS1', teams.sfS1[0].duplaNo, teams.sfS1[1].duplaNo);
    const wS2 = winnerOf(week, 'sfS2', teams.sfS2[0].duplaNo, teams.sfS2[1].duplaNo);
    const lS1 = loserOf(week, 'sfS1', teams.sfS1[0].duplaNo, teams.sfS1[1].duplaNo);
    const lS2 = loserOf(week, 'sfS2', teams.sfS2[0].duplaNo, teams.sfS2[1].duplaNo);

    if (wS1 !== null && wS2 !== null) {
      const finalWS = winnerOf(week, 'finalS', wS1, wS2);
      if (finalWS !== null) {
        const finalLS = finalWS === wS1 ? wS2 : wS1;
        addPontosDupla(week, finalWS, PONTOS_CAMPEAO_PRATA, totals);
        addPontosDupla(week, finalLS, PONTOS_VICE_PRATA, totals);
      }
    }
    // 3º/4º da Série Prata = disputa entre as perdedoras das semifinais
    // (mesmo os dois valendo o mesmo tanto, o jogo precisa acontecer —
    // é o critério oficial de classificação da rodada)
    if (lS1 !== null && lS2 !== null) {
      const thirdWS = winnerOf(week, 'thirdS', lS1, lS2);
      if (thirdWS !== null) {
        const thirdLS = thirdWS === lS1 ? lS2 : lS1;
        addPontosDupla(week, thirdWS, PONTOS_TERCEIRO_PRATA, totals);
        addPontosDupla(week, thirdLS, PONTOS_QUARTO_PRATA, totals);
      }
    }
  }
  const rows: RankingRow[] = [];
  for (let p = 1; p <= N_PLAYERS; p++) {
    rows.push({ num: p, name: playerName(players, p), pts: totals[p], pos: 0 });
  }
  rows.sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name, 'pt-BR'));
  rows.forEach((row, i) => { row.pos = i + 1; });
  return rows;
}

export function weekAssignedTo(weeks: WeeksMap, sorteioNo: number): number | null {
  for (let w = 1; w <= N_ROUNDS; w++) {
    if (weeks[w]?.assignedRound === sorteioNo) return w;
  }
  return null;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeDefaultRound(dates: string[]): number {
  const t = todayISO();
  let idx = dates.findIndex((d) => d >= t);
  if (idx === -1) idx = dates.length - 1;
  return idx + 1;
}

export function koTitle(key: KnockoutKey): string {
  switch (key) {
    case 'sfG1': return 'Semifinal Ouro 1 · 1ºA x 2ºB';
    case 'sfG2': return 'Semifinal Ouro 2 · 2ºA x 1ºB';
    case 'sfS1': return 'Semifinal Prata 1 · 3ºA x 4ºB';
    case 'sfS2': return 'Semifinal Prata 2 · 4ºA x 3ºB';
    default: return '';
  }
}

export type { Knockout, KnockoutKey };
