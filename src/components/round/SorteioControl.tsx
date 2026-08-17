import { useSeason } from '../../context/SeasonContext';
import { availableRoundsFor } from '../../data/domain';

interface Props {
  week: number;
}

export function SorteioControl({ week }: Props) {
  const { weeks, canEdit, setAssignedRound } = useSeason();
  const assigned = weeks[week]?.assignedRound ?? null;
  const opts = availableRoundsFor(weeks, week);

  function sortear() {
    const remaining = availableRoundsFor(weeks, week);
    if (remaining.length === 0) { alert('Todas as 15 rodadas já foram sorteadas em outras semanas.'); return; }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    void setAssignedRound(week, pick);
  }

  return (
    <div className="sorteio-row">
      <div>
        <div className="sorteio-label">
          {assigned ? <>Rodada sorteada desta semana: <strong>Sorteio nº {assigned}</strong></> : 'Esta semana ainda não tem rodada sorteada'}
        </div>
        {canEdit && (
          <select
            className="sel-sorteio"
            value={assigned ?? ''}
            onChange={(e) => setAssignedRound(week, e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— selecionar —</option>
            {opts.map((s) => <option key={s} value={s}>Sorteio nº {s}</option>)}
            {assigned && !opts.includes(assigned) && <option value={assigned}>Sorteio nº {assigned}</option>}
          </select>
        )}
      </div>
      {canEdit && (
        <div className="sorteio-actions">
          <button className="round-nav-btn" onClick={sortear}>🎲 Sortear aleatoriamente</button>
          {assigned && (
            <button className="round-nav-btn" onClick={() => setAssignedRound(week, null)}>Limpar sorteio</button>
          )}
        </div>
      )}
    </div>
  );
}
