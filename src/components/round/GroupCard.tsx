import { useSeason } from '../../context/SeasonContext';
import { COURT_NAMES, MATCH_PATTERN, courtOfGame } from '../../data/fixedData';
import {
  computeGroupStandings, duplaLabelByPair, duplaOfRoundLocal, duplasDoGrupo,
} from '../../data/domain';
import type { GroupKey } from '../../data/fixedData';

interface Props {
  week: number;
  group: GroupKey;
}

export function GroupCard({ week, group }: Props) {
  const { players, weeks, canEdit, setGroupScore } = useSeason();
  const weekData = weeks[week];
  const assigned = weekData?.assignedRound ?? null;
  const duplas = duplasDoGrupo(weekData, group);
  const standings = computeGroupStandings(weekData, group);

  return (
    <div className={`card group-card${group === 'B' ? ' groupB' : ''}`}>
      <h3>Grupo {group} <span className="group-tag">todos x todos</span></h3>
      <div className="matches">
        {MATCH_PATTERN.map((pat, i) => {
          const homeGlobal = duplas[pat[0]];
          const awayGlobal = duplas[pat[1]];
          const homePair = duplaOfRoundLocal(assigned, homeGlobal);
          const awayPair = duplaOfRoundLocal(assigned, awayGlobal);
          if (!homePair || !awayPair) return null;
          const gval = weekData?.groupScores[group][i] ?? { h: '', a: '' };
          const courtNum = courtOfGame(i);
          return (
            <div className="match-block" key={i}>
              <div className={`court-label q${courtNum}`}>Quadra 0{courtNum} · {COURT_NAMES[courtNum]}</div>
              <div className="match-row">
                <div className="team home">{duplaLabelByPair(homePair, weekData, players)}</div>
                <input
                  className="score-input" type="number" min={0} inputMode="numeric"
                  disabled={!canEdit}
                  value={gval.h}
                  onChange={(e) => setGroupScore(week, group, i, 'h', e.target.value)}
                />
                <div className="vs">×</div>
                <input
                  className="score-input" type="number" min={0} inputMode="numeric"
                  disabled={!canEdit}
                  value={gval.a}
                  onChange={(e) => setGroupScore(week, group, i, 'a', e.target.value)}
                />
                <div className="team away">{duplaLabelByPair(awayPair, weekData, players)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mini-standings">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Pos</th><th>Dupla</th><th className="center">J</th><th className="center">V</th><th className="center">Saldo</th><th className="center">Pts</th></tr></thead>
            <tbody>
              {standings.map((row) => {
                const pair = duplaOfRoundLocal(assigned, row.duplaNo);
                if (!pair) return null;
                return (
                  <tr key={row.duplaNo} className={row.pos <= 2 ? 'q-ouro' : 'q-prata'}>
                    <td>{row.pos}º</td>
                    <td>{duplaLabelByPair(pair, weekData, players)}</td>
                    <td className="center">{row.jogos}</td>
                    <td className="center">{row.v}</td>
                    <td className="center">{row.saldo}</td>
                    <td className="center pts">{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="qual-legend">
          <span><span className="sw" style={{ background: 'var(--gold)' }} />1º e 2º → Série Ouro</span>
          <span><span className="sw" style={{ background: 'var(--prata)' }} />3º e 4º → Série Prata</span>
        </div>
      </div>
    </div>
  );
}
