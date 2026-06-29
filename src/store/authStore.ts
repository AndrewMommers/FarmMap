import { create } from 'zustand';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: SupabaseUser | null;
  session: Session | null;
  /** True while the initial session check is in progress. */
  authLoading: boolean;

  setSession: (session: Session | null) => void;
  setAuthLoading: (v: boolean) => void;

  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  authLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, authLoading: false }),

  setAuthLoading: (v) => set({ authLoading: v }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
