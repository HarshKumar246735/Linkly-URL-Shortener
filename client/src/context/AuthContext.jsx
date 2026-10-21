import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  // Restore the session from the HttpOnly cookie on first load.
  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((current) => active && setUser(current))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // The API client fires this event when a protected request returns 401.
  useEffect(() => {
    const handleExpired = () => {
      if (userRef.current) toast.error('Your session has expired. Please log in again.');
      setUser(null);
    };
    window.addEventListener('linkly:unauthorized', handleExpired);
    return () => window.removeEventListener('linkly:unauthorized', handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const current = await authService.login(credentials);
    setUser(current);
    return current;
  }, []);

  const register = useCallback(async (details) => {
    const current = await authService.register(details);
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
