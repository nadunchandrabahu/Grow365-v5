import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function consumeAuthLink(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  let accessToken =
    typeof parsed.queryParams?.access_token === 'string'
      ? parsed.queryParams.access_token
      : undefined;
  let refreshToken =
    typeof parsed.queryParams?.refresh_token === 'string'
      ? parsed.queryParams.refresh_token
      : undefined;

  if (!accessToken || !refreshToken) {
    const parameterText = url.split('#')[1] ?? url.split('?')[1] ?? '';
    const parameters = parameterText.split('&').reduce<Record<string, string>>(
      (result, entry) => {
        const [rawKey, rawValue] = entry.split('=');
        if (rawKey && rawValue) {
          result[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
        }
        return result;
      },
      {},
    );
    accessToken = parameters.access_token;
    refreshToken = parameters.refresh_token;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async (): Promise<void> => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await consumeAuthLink(initialUrl);
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSession(data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initialize();
    const authSubscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      void consumeAuthLink(url);
    });

    return () => {
      mounted = false;
      authSubscription.data.subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
          full_name: name.trim(),
          name: name.trim(),
        },
      },
    });
    if (error) throw error;
    return { requiresEmailConfirmation: data.session === null };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    const redirectTo = 'grow365-mobile://update-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [loading, sendPasswordReset, session, signIn, signOut, signUp, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}