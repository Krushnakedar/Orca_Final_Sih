import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';
import { clearAll as clearOfflineCache } from '../services/offlineCache';
import { LOGOUT_POLICY } from '../offline/syncPolicy';
import { clearAll as clearSyncQueue } from '../offline/outbox';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem('orca_auth_token'),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('orca_auth_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('orca_auth_token');
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedToken = localStorage.getItem('orca_auth_token');
      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        const res = await authService.getProfile();
        if (isMounted && res.user) {
          setUser(res.user);
          setToken(savedToken);
        }
      } catch (err) {
        const isNetworkFailure =
          err?.offline === true ||
          err?.status === 0 ||
          (!err?.status && !!err?.message);

        if (isNetworkFailure) {
          if (isMounted) {
            setToken(savedToken);
          }
        } else {
          console.warn('[Auth] Session expired or invalid:', err.message);
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('orca_auth_token');
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      if (LOGOUT_POLICY === 'discard') {
        try {
          await clearSyncQueue();
        } catch {
          /* ignore */
        }
      }

      setUser(null);
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('orca_auth_token');

      try {
        await clearOfflineCache();
      } catch {
        /* ignore */
      }

      try {
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(
            names
              .filter((n) => n.startsWith('orca-'))
              .map((n) => caches.delete(n)),
          );
        }
      } catch {
        /* ignore */
      }
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}