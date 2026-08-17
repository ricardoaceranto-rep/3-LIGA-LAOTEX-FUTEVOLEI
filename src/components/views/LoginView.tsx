import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ViewName } from '../../App';

interface Props {
  onDone: (v: ViewName) => void;
}

export function LoginView({ onDone }: Props) {
  const { login, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      onDone('overview');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view">
      <div className="hero">
        <div>
          <h2>Login do organizador</h2>
          <p>Acesso restrito ao admin da liga. Os demais jogadores acompanham tudo pelo link público, sem precisar entrar.</p>
        </div>
      </div>
      <div className="card login-card">
        {!configured && (
          <div className="login-error">
            Firebase ainda não configurado neste ambiente (variáveis VITE_FIREBASE_*). Veja o README.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="login-password">Senha</label>
          <input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="save-row">
            <button className="primary" type="submit" disabled={submitting || !configured}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
            <button type="button" className="round-nav-btn" onClick={() => onDone('overview')}>Voltar</button>
          </div>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </section>
  );
}
