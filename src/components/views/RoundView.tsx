import { useSeason } from '../../context/SeasonContext';
import { GROUPS, N_ROUNDS } from '../../data/fixedData';
import { formatDateLong } from '../../data/domain';
import { SorteioControl } from '../round/SorteioControl';
import { DuplasGrid } from '../round/DuplasGrid';
import { GroupCard } from '../round/GroupCard';
import { KnockoutBracket } from '../round/KnockoutBracket';

interface Props {
  week: number;
  onPrev: () => void;
  onNext: () => void;
}

export function RoundView({ week, onPrev, onNext }: Props) {
  const { dates, weeks } = useSeason();
  const assigned = weeks[week]?.assignedRound ?? null;
  const locked = !assigned;

  return (
    <section className="view">
      <div className="round-head">
        <div>
          <h2>Semana {week}</h2>
          <div className="date-line">{formatDateLong(dates[week - 1])}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="round-nav-btn" disabled={week <= 1} onClick={onPrev}>← Semana anterior</button>
          <button className="round-nav-btn" disabled={week >= N_ROUNDS} onClick={onNext}>Próxima semana →</button>
        </div>
      </div>

      <div className="card sorteio-card">
        <h3>Sorteio da rodada</h3>
        <SorteioControl week={week} />
      </div>

      {locked && (
        <div className="card round-locked">
          <div className="dice">🎲</div>
          <div>Esta semana ainda não tem rodada sorteada.<br />Escolha ou sorteie uma rodada acima para liberar os jogos.</div>
        </div>
      )}

      {!locked && (
        <>
          <div className="card">
            <h3>Duplas da rodada</h3>
            <div className="note">Pré-preenchido com os jogadores cadastrados. Edite um nome só para incluir um suplente <strong>nesta rodada</strong> — não altera o cadastro geral nem o ranking acumulado.</div>
            <DuplasGrid week={week} />
          </div>

          <div className="groups-grid">
            {GROUPS.map((g) => <GroupCard key={g} week={week} group={g} />)}
          </div>

          <KnockoutBracket week={week} />
        </>
      )}
    </section>
  );
}
