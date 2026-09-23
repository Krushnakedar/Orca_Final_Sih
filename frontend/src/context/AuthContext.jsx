import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';
import { clearAll as clearOfflineCache } from '../services/offlineCache';
import { LOGOUT_POLICY } from '../offline/syncPolicy';
import { clearAll as clearSyncQueue } from '../offline/outbox';

export const AuthContext = createContext(null);

// Separate from the generic offline API cache on purpose — offlineCache.js
// deliberately never caches anything under /auth/. This stores only a
// minimal, non-sensitive display snapshot (no tokens, no permissions) so
// we can keep a user's session alive across an offline reload without
// trusting cached data for anything security-relevant.
const CACHED_USER_KEY = 'orca_auth_user_snapshot';

function cacheUserSnapshot(user) {
  try {
    if (!user) return;
    const snapshot = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      vesselName: user.vesselName,
      preferredSector: user.preferredSector,
    };
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

function readCachedUserSnapshot() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearCachedUserSnapshot() {
  try {
    localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem('orca_auth_token'),
  );
  const [loading, setLoading] = useState(true);
  // True when `user` is coming from the local snapshot rather than a
  // server-verified /auth/me response (i.e. we're offline). UI can use
  // this to show an "offline session, unverified" indicator.
  const [isOfflineSession, setIsOfflineSession] = useState(false);

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
          setIsOfflineSession(false);
          cacheUserSnapshot(res.user);
        }
      } catch (err) {
        const isNetworkFailure =
          err?.offline === true ||
          err?.status === 0 ||
          (!err?.status && !!err?.message);

        if (isNetworkFailure) {
          // Can't reach the server to verify the token, but that's not the
          // same as the token being invalid. Trust the last verified
          // session (if we have one) instead of forcing a login screen
          // just because the network dropped — consistent with the rest
          // of the app's offline-first design.
          const cachedUser = readCachedUserSnapshot();
          if (isMounted) {
            setToken(savedToken);
            if (cachedUser) {
              setUser(cachedUser);
              setIsOfflineSession(true);
            }
          }
        } else {
          console.warn('[Auth] Session expired or invalid:', err.message);
          if (isMounted) {
            setUser(null);
            setToken(null);
            setIsOfflineSession(false);
            localStorage.removeItem('orca_auth_token');
            clearCachedUserSnapshot();
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
      setIsOfflineSession(false);
      cacheUserSnapshot(res.user);
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
      setIsOfflineSession(false);
      cacheUserSnapshot(res.user);
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
      setIsOfflineSession(false);
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('orca_auth_token');
      clearCachedUserSnapshot();

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
    isOfflineSession,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}