import { BrandBall } from './BrandBall';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import type { ViewName } from '../App';

interface Props {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
}

const NAV_ITEMS: { key: ViewName; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'ranking', label: 'Ranking' },
  { key: 'sorteios', label: 'Sorteios' },
  { key: 'players', label: 'Jogadores' },
];

export function TopBar({ view, onNavigate }: Props) {
  const { seasonName } = useSeason();
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="topbar-row">
      <div className="brand">
        <BrandBall />
        <div>
          <h1>{seasonName}</h1>
          <div className="sub">Futevôlei · 16 jogadores · 15 rodadas</div>
        </div>
      </div>
      <div className="topbar-right">
        <nav className="views">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? 'active' : ''}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-pill">
          {isAdmin ? (
            <>
              <span className="admin-badge on">Admin · {user?.email}</span>
              <button className="link-btn" onClick={() => logout()}>Sair</button>
            </>
          ) : (
            <button className="link-btn" onClick={() => onNavigate('login')}>Entrar como admin</button>
          )}
        </div>
      </div>
    </div>
  );
}
