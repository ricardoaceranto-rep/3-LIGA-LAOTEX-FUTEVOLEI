import { useEffect, useState } from 'react';
import { useSeason } from '../../context/SeasonContext';
import { N_PLAYERS } from '../../data/fixedData';

export function PlayersView() {
  const { players, canEdit, savePlayers } = useSeason();
  const [draft, setDraft] = useState(players);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => { setDraft(players); }, [players]);

  async function handleSave() {
    await savePlayers(draft);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1800);
  }

  return (
    <section className="view">
      <div className="hero">
        <div>
          <h2>Jogadores</h2>
          <p>
            {canEdit
              ? 'Preencha o nome dos 16 participantes. Os nomes são usados em todas as duplas e jogos das 15 rodadas.'
              : 'Os 16 participantes cadastrados na temporada.'}
          </p>
        </div>
      </div>
      <div className="card">
        <div className="players-grid">
          {Array.from({ length: N_PLAYERS }, (_, i) => (
            <div className="player-field" key={i}>
              <label>Jogador {i + 1}</label>
              <input
                type="text"
                value={draft[i] ?? ''}
                disabled={!canEdit}
                onChange={(e) => setDraft((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
              />
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="save-row">
            <button className="primary" onClick={handleSave}>Salvar jogadores</button>
            <span className={`save-msg${showSaved ? ' show' : ''}`}>Salvo!</span>
          </div>
        )}
      </div>
    </section>
  );
}
