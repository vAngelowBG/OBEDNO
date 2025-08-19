import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '@supabase/supabase-js';
import { Tables } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Tables<'profiles'> | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isClient: boolean;
  isRestaurant: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}