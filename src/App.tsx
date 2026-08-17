import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { SeasonStrip } from './components/SeasonStrip';
import { OverviewView } from './components/views/OverviewView';
import { RankingView } from './components/views/RankingView';
import { SorteiosView } from './components/views/SorteiosView';
import { PlayersView } from './components/views/PlayersView';
import { RoundView } from './components/views/RoundView';
import { LoginView } from './components/views/LoginView';
import { useSeason } from './context/SeasonContext';
import { computeDefaultRound } from './data/domain';
import { N_ROUNDS } from './data/fixedData';

export type ViewName = 'overview' | 'ranking' | 'sorteios' | 'players' | 'round' | 'login';

export default function App() {
  const { dates, loading } = useSeason();
  const [view, setView] = useState<ViewName>('overview');
  const [currentRound, setCurrentRound] = useState<number>(() => computeDefaultRound(dates));

  function openRound(week: number) {
    setCurrentRound(week);
    setView('round');
  }

  function navigate(v: ViewName) {
    setView(v);
  }

  return (
    <>
      <header className="topbar">
        <TopBar view={view} onNavigate={navigate} />
        <SeasonStrip view={view} currentRound={currentRound} onOpenRound={openRound} />
      </header>

      <main>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Carregando dados da temporada…</div>
        ) : (
          <>
            {view === 'overview' && <OverviewView onOpenRound={openRound} />}
            {view === 'ranking' && <RankingView />}
            {view === 'sorteios' && <SorteiosView />}
            {view === 'players' && <PlayersView />}
            {view === 'login' && <LoginView onDone={navigate} />}
            {view === 'round' && (
              <RoundView
                week={currentRound}
                onPrev={() => currentRound > 1 && setCurrentRound(currentRound - 1)}
                onNext={() => currentRound < N_ROUNDS && setCurrentRound(currentRound + 1)}
              />
            )}
          </>
        )}
      </main>

      <footer>{`3º LIGA LALOTEX DE FUTÊVOLEI — os dados ficam salvos automaticamente e atualizam em tempo real.`}</footer>
    </>
  );
}
