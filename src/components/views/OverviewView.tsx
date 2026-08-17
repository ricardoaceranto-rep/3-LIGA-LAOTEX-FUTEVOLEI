import { useMemo } from 'react';
import { useSeason } from '../../context/SeasonContext';
import { N_ROUNDS } from '../../data/fixedData';
import {
  availableRoundsFor, championsOfRound, computeDefaultRound, duplaLabelByPair,
  formatDate, roundStatus,
} from '../../data/domain';

interface Props {
  onOpenRound: (week: number) => void;
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  done: { cls: 'done', label: 'Concluída' },
  progress: { cls: 'progress', label: 'Em andamento' },
  undrawn: { cls: 'undrawn', label: 'Não sorteada' },
  upcoming: { cls: 'upcoming', label: 'A definir' },
};

export function OverviewView({ onOpenRound }: Props) {
  const { dates, weeks, players, canEdit, setAssignedRound, sortearTodasAsRodadas } = useSeason();

  const doneCount = useMemo(() => [...Array(N_ROUNDS).keys()].filter((i) => roundStatus(weeks[i + 1]) === 'done').length, [weeks]);
  const drawnCount = useMemo(() => [...Array(N_ROUNDS).keys()].filter((i) => weeks[i + 1]?.assignedRound).length, [weeks]);
  const nextIdx = useMemo(() => computeDefaultRound(dates), [dates]);

  return (
    <section className="view">
      <div className="hero">
        <div>
          <h2>Temporada 2026</h2>
          <p>Toda segunda-feira, sorteia-se qual das 15 rodadas pré-sorteadas será jogada. 8 duplas por semana, sem repetir parceria em toda a temporada.</p>
        </div>
        <div className="stat-row">
          <div className="stat-card"><div className="num">{doneCount}/{N_ROUNDS}</div><div className="lbl">Rodadas concluídas</div></div>
          <div className="stat-card"><div className="num">{drawnCount}/{N_ROUNDS}</div><div className="lbl">Rodadas sorteadas</div></div>
          <div className="stat-card"><div className="num">Sem {nextIdx}</div><div className="lbl">Próxima / atual semana</div></div>
          <div className="stat-card"><div className="num">{formatDate(dates[N_ROUNDS - 1])}</div><div className="lbl">Final da temporada</div></div>
        </div>
      </div>

      <div className="card sorteio-card">
        <h3>Sorteio da temporada</h3>
        <div className="note">
          Primeiro sorteiam-se as duplas de cada rodada (Sorteio nº 1 ao 15 — já feito, sem repetir parceria).
          Depois, semana a semana, sorteia-se apenas <strong>qual dessas rodadas será jogada</strong>. Defina aqui ou direto na semana.
        </div>
        <div className="table-scroll">
          <table className="responsive">
            <thead><tr><th>Semana</th><th>Data</th><th>Rodada sorteada</th></tr></thead>
            <tbody>
              {dates.map((iso, i) => {
                const w = i + 1;
                const assigned = weeks[w]?.assignedRound ?? null;
                const opts = availableRoundsFor(weeks, w);
                return (
                  <tr key={w} className="sorteio-overview-row">
                    <td data-label="Semana" className="mono">Semana {w}</td>
                    <td data-label="Data" className="mono">{formatDate(iso)}</td>
                    <td data-label="Rodada sorteada">
                      <select
                        value={assigned ?? ''}
                        disabled={!canEdit}
                        onChange={(e) => setAssignedRound(w, e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">— não sorteada —</option>
                        {opts.map((s) => <option key={s} value={s}>Sorteio nº {s}</option>)}
                        {assigned && !opts.includes(assigned) && <option value={assigned}>Sorteio nº {assigned}</option>}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {canEdit && (
          <div className="save-row">
            <button className="primary" onClick={() => sortearTodasAsRodadas()}>🎲 Sortear todas as rodadas restantes</button>
            <span className="sorteio-count">{drawnCount}/{N_ROUNDS} sorteadas</span>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Como funciona cada rodada</h3>
        <div className="note">O mesmo formato se repete toda semana, com as duplas da rodada sorteada para aquele dia.</div>
        <div className="table-scroll">
          <table>
            <tbody>
              <tr><td style={{ width: 26 }} className="mono">1</td><td>As 15 rodadas (Sorteio nº 1 a 15) já têm as 8 duplas de cada uma pré-sorteadas — nenhuma parceria se repete em toda a temporada.</td></tr>
              <tr><td className="mono">2</td><td>Toda semana, sorteia-se qual dessas 15 rodadas será jogada naquele dia (ver "Sorteio da temporada" acima ou dentro da própria semana).</td></tr>
              <tr><td className="mono">3</td><td>Ao atribuir a rodada à semana, as 8 duplas são sorteadas de novo em 2 grupos de 4 (A e B). Dentro do grupo, todos jogam contra todos uma vez — 3 jogos por dupla, divididos entre as Quadras 01 (LABOMLOTEX) e 02 (CARANLOTEX). Vitória vale 3 pontos, derrota 0. O saldo de pontos é o critério de desempate.</td></tr>
              <tr><td className="mono">4</td><td><strong>Série Ouro</strong> (1º e 2º de cada grupo): semifinais 1ºA × 2ºB e 2ºA × 1ºB, depois final entre as vencedoras.</td></tr>
              <tr><td className="mono">5</td><td><strong>Série Prata</strong> (3º e 4º de cada grupo): semifinais 3ºA × 4ºB e 4ºA × 3ºB, depois final entre as vencedoras.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Calendário &amp; campeãs</h3>
        <div className="note">Clique em qualquer rodada para abrir os jogos daquela semana.</div>
        <div className="table-scroll">
          <table className="responsive">
            <thead>
              <tr><th>Semana</th><th>Data</th><th>Rodada</th><th>Status</th><th>Campeã Ouro</th><th>Campeã Prata</th></tr>
            </thead>
            <tbody>
              {dates.map((iso, i) => {
                const w = i + 1;
                const week = weeks[w];
                const st = roundStatus(week);
                const ar = week?.assignedRound ?? null;
                const badge = STATUS_BADGE[st];
                const champs = ar ? championsOfRound(week) : { ouro: null, prata: null };
                const ouroTxt = champs.ouro ? duplaLabelByPair(champs.ouro, week, players) : '—';
                const prataTxt = champs.prata ? duplaLabelByPair(champs.prata, week, players) : '—';
                return (
                  <tr key={w} style={{ cursor: 'pointer' }} onClick={() => onOpenRound(w)}>
                    <td data-label="Semana" className="mono">Semana {w}</td>
                    <td data-label="Data" className="mono">{formatDate(iso)}</td>
                    <td data-label="Rodada" className="mono">{ar ? `Nº ${ar}` : '—'}</td>
                    <td data-label="Status"><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                    <td data-label="Campeã Ouro">{ouroTxt}</td>
                    <td data-label="Campeã Prata">{prataTxt}</td>
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
