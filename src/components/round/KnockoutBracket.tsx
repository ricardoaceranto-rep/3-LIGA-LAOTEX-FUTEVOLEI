import { useSeason } from '../../context/SeasonContext';
import {
  duplaLabelByPair, duplaOfRoundLocal, koTeamsForRound, koTitle, loserOf, winnerOf,
} from '../../data/domain';
import type { GroupStandingRow } from '../../data/types';
import type { KnockoutKey } from '../../data/types';

interface Props {
  week: number;
}

interface SemiBoxProps {
  week: number;
  koKey: KnockoutKey;
  teams: [GroupStandingRow, GroupStandingRow];
}

function SemiBox({ week, koKey, teams }: SemiBoxProps) {
  const { players, weeks, canEdit, setKnockoutScore } = useSeason();
  const weekData = weeks[week];
  const assigned = weekData?.assignedRound ?? null;
  const s = weekData?.knockout[koKey] ?? { h: '', a: '' };
  const pairA = duplaOfRoundLocal(assigned, teams[0].duplaNo);
  const pairB = duplaOfRoundLocal(assigned, teams[1].duplaNo);
  const winner = winnerOf(weekData, koKey, teams[0].duplaNo, teams[1].duplaNo);
  if (!pairA || !pairB) return null;

  return (
    <div className="ko-box">
      <h5>{koTitle(koKey)}</h5>
      <div className={`ko-team${winner === teams[0].duplaNo ? ' winner' : ''}`}>
        <div className="name">Grupo {teams[0].group} {teams[0].pos}º · {duplaLabelByPair(pairA, weekData, players)}</div>
        <input className="score-input" type="number" min={0} inputMode="numeric" disabled={!canEdit} value={s.h} onChange={(e) => setKnockoutScore(week, koKey, 'h', e.target.value)} />
      </div>
      <div className={`ko-team${winner === teams[1].duplaNo ? ' winner' : ''}`}>
        <div className="name">Grupo {teams[1].group} {teams[1].pos}º · {duplaLabelByPair(pairB, weekData, players)}</div>
        <input className="score-input" type="number" min={0} inputMode="numeric" disabled={!canEdit} value={s.a} onChange={(e) => setKnockoutScore(week, koKey, 'a', e.target.value)} />
      </div>
    </div>
  );
}

interface ResultBoxProps {
  week: number;
  koKey: KnockoutKey;
  title: string;
  serie: 'ouro' | 'prata';
  duplaA: number | null;
  duplaB: number | null;
  badgeIcon: string;
  badgeLabel: string;
  waitingLabel: string;
}

// Usado tanto pra Final quanto pra Disputa de 3º Lugar — mesmo padrão
// visual/funcional (placar editável, dupla vencedora destacada, selo de
// resultado ao final), mudando só os times, o título e o texto do selo.
function ResultBox({ week, koKey, title, serie, duplaA, duplaB, badgeIcon, badgeLabel, waitingLabel }: ResultBoxProps) {
  const { players, weeks, canEdit, setKnockoutScore } = useSeason();
  const weekData = weeks[week];
  const assigned = weekData?.assignedRound ?? null;
  const s = weekData?.knockout[koKey] ?? { h: '', a: '' };

  if (duplaA === null || duplaB === null) {
    return (
      <div className={`ko-box ko-final ${serie}`}>
        <h5>{title}</h5>
        <div className="note" style={{ margin: 0 }}>{waitingLabel}</div>
      </div>
    );
  }

  const pairA = duplaOfRoundLocal(assigned, duplaA);
  const pairB = duplaOfRoundLocal(assigned, duplaB);
  if (!pairA || !pairB) return null;
  const winner = winnerOf(weekData, koKey, duplaA, duplaB);
  const winnerPair = winner !== null ? duplaOfRoundLocal(assigned, winner) : null;

  return (
    <div className={`ko-box ko-final ${serie}`}>
      <h5>{title}</h5>
      <div className={`ko-team${winner === duplaA ? ' winner' : ''}`}>
        <div className="name">{duplaLabelByPair(pairA, weekData, players)}</div>
        <input className="score-input" type="number" min={0} inputMode="numeric" disabled={!canEdit} value={s.h} onChange={(e) => setKnockoutScore(week, koKey, 'h', e.target.value)} />
      </div>
      <div className={`ko-team${winner === duplaB ? ' winner' : ''}`}>
        <div className="name">{duplaLabelByPair(pairB, weekData, players)}</div>
        <input className="score-input" type="number" min={0} inputMode="numeric" disabled={!canEdit} value={s.a} onChange={(e) => setKnockoutScore(week, koKey, 'a', e.target.value)} />
      </div>
      {winnerPair && (
        <div className={`champion-badge ${serie}`}>{badgeIcon} {badgeLabel}: {duplaLabelByPair(winnerPair, weekData, players)}</div>
      )}
    </div>
  );
}

export function KnockoutBracket({ week }: Props) {
  const { weeks } = useSeason();
  const weekData = weeks[week];
  const teams = koTeamsForRound(weekData);

  const wG1 = winnerOf(weekData, 'sfG1', teams.sfG1[0].duplaNo, teams.sfG1[1].duplaNo);
  const wG2 = winnerOf(weekData, 'sfG2', teams.sfG2[0].duplaNo, teams.sfG2[1].duplaNo);
  const lG1 = loserOf(weekData, 'sfG1', teams.sfG1[0].duplaNo, teams.sfG1[1].duplaNo);
  const lG2 = loserOf(weekData, 'sfG2', teams.sfG2[0].duplaNo, teams.sfG2[1].duplaNo);

  const wS1 = winnerOf(weekData, 'sfS1', teams.sfS1[0].duplaNo, teams.sfS1[1].duplaNo);
  const wS2 = winnerOf(weekData, 'sfS2', teams.sfS2[0].duplaNo, teams.sfS2[1].duplaNo);
  const lS1 = loserOf(weekData, 'sfS1', teams.sfS1[0].duplaNo, teams.sfS1[1].duplaNo);
  const lS2 = loserOf(weekData, 'sfS2', teams.sfS2[0].duplaNo, teams.sfS2[1].duplaNo);

  return (
    <div className="card" id="knockoutCard">
      <h3>Mata-mata do dia</h3>
      <div className="note">Cruzamento entre os grupos. Série Ouro com o 1º/2º colocados; Série Prata com o 3º/4º.</div>

      <div className="serie-block">
        <div className="serie-title ouro"><span className="serie-dot ouro" /><h4>Série Ouro</h4></div>
        <div className="bracket">
          <SemiBox week={week} koKey="sfG1" teams={teams.sfG1} />
          <SemiBox week={week} koKey="sfG2" teams={teams.sfG2} />
          <ResultBox
            week={week} koKey="finalG" title="Final Série Ouro" serie="ouro"
            duplaA={wG1} duplaB={wG2} badgeIcon="🏆" badgeLabel="Campeã Série Ouro"
            waitingLabel="Aguardando resultado das semifinais…"
          />
          <ResultBox
            week={week} koKey="thirdG" title="Disputa de 3º Lugar · Série Ouro" serie="ouro"
            duplaA={lG1} duplaB={lG2} badgeIcon="🥉" badgeLabel="3º lugar Série Ouro"
            waitingLabel="Aguardando resultado das semifinais…"
          />
        </div>
      </div>

      <div className="serie-block">
        <div className="serie-title prata"><span className="serie-dot prata" /><h4>Série Prata</h4></div>
        <div className="bracket">
          <SemiBox week={week} koKey="sfS1" teams={teams.sfS1} />
          <SemiBox week={week} koKey="sfS2" teams={teams.sfS2} />
          <ResultBox
            week={week} koKey="finalS" title="Final Série Prata" serie="prata"
            duplaA={wS1} duplaB={wS2} badgeIcon="🏆" badgeLabel="Campeã Série Prata"
            waitingLabel="Aguardando resultado das semifinais…"
          />
          <ResultBox
            week={week} koKey="thirdS" title="Disputa de 3º Lugar · Série Prata" serie="prata"
            duplaA={lS1} duplaB={lS2} badgeIcon="🥉" badgeLabel="3º lugar Série Prata"
            waitingLabel="Aguardando resultado das semifinais…"
          />
        </div>
      </div>
    </div>
  );
}
