import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { ADMIN_EMAIL, auth, firebaseConfigured } from '../firebase';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin = Boolean(user && user.email && ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  async function login(email: string, password: string) {
    if (!auth) throw new Error('Firebase não configurado.');
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, configured: firebaseConfigured, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
