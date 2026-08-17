import { useSeason } from '../../context/SeasonContext';
import { N_ROUNDS, ROUNDS } from '../../data/fixedData';
import { formatDate, playerName, weekAssignedTo } from '../../data/domain';

export function SorteiosView() {
  const { players, dates, weeks } = useSeason();

  return (
    <section className="view">
      <div className="hero">
        <div>
          <h2>Sorteios</h2>
          <p>
            As 8 duplas de cada um dos 15 sorteios, já com os nomes cadastrados. As parcerias foram definidas por{' '}
            <strong>sorteio aleatório</strong>, com checagem matemática garantindo que as 120 combinações possíveis
            entre os 16 jogadores apareçam exatamente uma vez na temporada — nenhuma parceria se repete. A divisão
            dessas 8 duplas em Grupo A / Grupo B é sorteada de novo, aleatoriamente, no momento em que a rodada é
            atribuída a uma semana.
          </p>
        </div>
      </div>
      <div className="sorteios-grid">
        {Array.from({ length: N_ROUNDS }, (_, idx) => {
          const s = idx + 1;
          const pairs = ROUNDS[idx];
          const week = weekAssignedTo(weeks, s);
          return (
            <div className="sorteio-item-card" key={s}>
              <h4>Sorteio nº {s}</h4>
              {week ? (
                <div className="week-tag assigned">✓ Jogada na Semana {week} · {formatDate(dates[week - 1])}</div>
              ) : (
                <div className="week-tag free">Ainda não atribuído a nenhuma semana</div>
              )}
              <div className="sorteio-group-label A">As 8 duplas</div>
              {pairs.map((pair, i) => (
                <div className="dupla-line" key={i}>
                  Dupla {i + 1} — {playerName(players, pair[0])} / {playerName(players, pair[1])}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
