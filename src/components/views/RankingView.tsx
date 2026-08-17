import { useMemo } from 'react';
import { useSeason } from '../../context/SeasonContext';
import { computeRankingGeral } from '../../data/domain';

export function RankingView() {
  const { players, weeks } = useSeason();
  const rows = useMemo(() => computeRankingGeral(players, weeks), [players, weeks]);

  return (
    <section className="view">
      <div className="hero">
        <div>
          <h2>Ranking Individual</h2>
          <p>Pontuação acumulada de cada jogador na temporada, somando os resultados de todas as rodadas já concluídas.</p>
        </div>
      </div>
      <div className="card">
        <h3>Como pontua</h3>
        <div className="table-scroll">
          <table>
            <tbody>
              <tr><td>🥇 Campeão Série Ouro</td><td className="center mono">8 pts</td></tr>
              <tr><td>🥈 Vice Série Ouro</td><td className="center mono">6 pts</td></tr>
              <tr><td>Semifinalistas Série Ouro (3º e 4º)</td><td className="center mono">4 pts</td></tr>
              <tr><td>🥇 Campeão Série Prata</td><td className="center mono">3 pts</td></tr>
              <tr><td>🥈 Vice Série Prata</td><td className="center mono">2 pts</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 10 }}>Os dois jogadores da dupla recebem a mesma pontuação. Pontos somam de todas as rodadas concluídas até agora.</div>
      </div>
      <div className="card">
        <h3>Classificação geral</h3>
        <div className="table-scroll">
          <table>
            <thead><tr><th className="center">Pos.</th><th>Jogador</th><th className="center">Pontos</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const medal = row.pos === 1 ? 'medal-1' : row.pos === 2 ? 'medal-2' : row.pos === 3 ? 'medal-3' : '';
                return (
                  <tr key={row.num} className={`rank-row ${medal}`}>
                    <td className="rank-pos">{row.pos}º</td>
                    <td>{row.name}</td>
                    <td className="center rank-pts">{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
