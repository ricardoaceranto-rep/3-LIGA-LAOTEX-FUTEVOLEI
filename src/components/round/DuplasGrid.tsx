import { GROUPS } from '../../data/fixedData';
import { useSeason } from '../../context/SeasonContext';
import { duplaOfRoundLocal, duplasDoGrupo, playerName, roundPlayerName } from '../../data/domain';

interface Props {
  week: number;
}

export function DuplasGrid({ week }: Props) {
  const { players, weeks, canEdit, setPlayerOverride } = useSeason();
  const weekData = weeks[week];
  const assigned = weekData?.assignedRound ?? null;

  return (
    <div className="duplas-grid">
      {GROUPS.map((g) => (
        duplasDoGrupo(weekData, g).map((duplaNo) => {
          const pair = duplaOfRoundLocal(assigned, duplaNo);
          if (!pair) return null;
          const ovA = (weekData?.playerOverrides?.[pair[0]] ?? '').trim();
          const ovB = (weekData?.playerOverrides?.[pair[1]] ?? '').trim();
          return (
            <div className="dupla-item" key={`${g}-${duplaNo}`}>
              <div className="dtag"><span>Dupla {duplaNo}</span><span className="grp">Grupo {g}</span></div>
              {([pair[0], pair[1]] as const).map((playerNum, i) => (
                <input
                  key={playerNum}
                  type="text"
                  disabled={!canEdit}
                  className={(i === 0 ? ovA : ovB) ? 'overridden' : ''}
                  value={roundPlayerName(weekData, players, playerNum)}
                  placeholder={playerName(players, playerNum)}
                  onChange={(e) => setPlayerOverride(week, playerNum, e.target.value, playerName(players, playerNum))}
                />
              ))}
            </div>
          );
        })
      ))}
    </div>
  );
}
