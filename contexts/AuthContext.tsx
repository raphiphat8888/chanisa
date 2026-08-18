import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { apiConfigured, clearSession, restoreUser, signIn as apiSignIn, signUp as apiSignUp, type ApiUser } from '@/lib/api';

export type AppUser = {
  id: string;
  email: string;
  username: string;
  isDemo?: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  enterDemoMode: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: ApiUser | null): AppUser | null {
  return user ? { id: user.id, email: user.email, username: user.username } : null;
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [demoUser, setDemoUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    restoreUser().then((storedUser) => {
      if (mounted) {
        setUser(mapUser(storedUser));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: user ?? demoUser,
    loading,
    configured: apiConfigured,
    signIn: async (email, password) => {
      try {
        const signedInUser = await apiSignIn(email.trim(), password);
        setUser(mapUser(signedInUser));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ';
      }
    },
    signUp: async (email, password) => {
      try {
        await apiSignUp(email.trim(), password);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : 'สร้างบัญชีไม่สำเร็จ';
      }
    },
    enterDemoMode: () => setDemoUser({ id: 'demo-user', email: 'demo@menupilot.local', username: 'demo', isDemo: true }),
    signOut: async () => {
      setDemoUser(null);
      await clearSession();
      setUser(null);
    },
  }), [demoUser, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
