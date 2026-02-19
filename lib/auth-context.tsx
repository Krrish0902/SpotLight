import React, { createContext, useContext, useEffect, useState } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

async function upsertUser(userId: string, email: string, role: UserRole): Promise<{ error: PostgrestError | null }> {
  const row = { user_id: userId, email, role };
  // Try insert first (for new users); if row exists, update
  const { error: insertErr } = await supabase.from('users').insert(row);
  if (!insertErr) return { error: null };
  if (insertErr.code === '23505') {
    const { error: updateErr } = await supabase.from('users').update({ role }).eq('user_id', userId);
    return { error: updateErr };
  }
  return { error: insertErr };
}

export type UserRole = 'artist' | 'organizer' | 'public' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Profile {
  profile_id: string;
  user_id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  genres: string[] | null;
  instruments: string[] | null;
  is_boosted: boolean;
  boost_expiry: string | null;
  profile_image_url?: string | null;
  avatar_url?: string | null;
}

export interface ProfileInput {
  username?: string;
  display_name: string;
  bio?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  genres?: string[];
  instruments?: string[];
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  saveProfile: (data: ProfileInput) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  };

  const fetchAppUser = async (userId: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return { id: data.user_id, email: data.email, role: data.role as UserRole };
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const au = await fetchAppUser(session.user.id);
        setAppUser(au);
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else {
        setAppUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const au = await fetchAppUser(session.user.id);
          setAppUser(au);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        } else {
          setAppUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (error) return { error: new Error(error.message) };

    if (data.user) {
      const { error: dbError } = await upsertUser(
        data.user.id,
        data.user.email ?? email,
        role
      );
      if (dbError) console.warn('signUp: could not sync to users table', dbError.message);
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAppUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const uid = user?.id ?? session?.user?.id;
    if (uid) {
      const prof = await fetchProfile(uid);
      setProfile(prof);
    }
  };

  const saveProfile = async (data: ProfileInput): Promise<{ error: Error | null }> => {
    const uid = user?.id ?? session?.user?.id;
    if (!uid) return { error: new Error('Not authenticated') };
    const updateRow = {
      username: data.username?.trim().toLowerCase() || null,
      display_name: data.display_name,
      bio: data.bio ?? null,
      city: data.city ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      genres: data.genres ?? null,
      instruments: data.instruments ?? null,
    };
    // Update existing profile (edit) — never create duplicate
    if (profile) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updateRow)
        .eq('user_id', uid);
      if (updateErr) return { error: new Error(updateErr.message) };
      await refreshProfile();
      return { error: null };
    }
    // Insert new profile (signup flow)
    const insertRow = { user_id: uid, ...updateRow };
    const { error: insertErr } = await supabase.from('profiles').insert(insertRow);
    if (!insertErr) {
      await refreshProfile();
      return { error: null };
    }
    // Row exists (e.g. profile was null in context) — update instead
    if (insertErr.code === '23505') {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updateRow)
        .eq('user_id', uid);
      if (updateErr) return { error: new Error(updateErr.message) };
      await refreshProfile();
      return { error: null };
    }
    return { error: new Error(insertErr.message) };
  };

  const updateRole = async (role: UserRole) => {
    const currentUser = user ?? session?.user;
    if (!currentUser) return { error: new Error('Not authenticated') };
    const { error } = await upsertUser(
      currentUser.id,
      currentUser.email ?? '',
      role
    );
    if (error) return { error: new Error(error.message) };
    setAppUser(prev => prev ? { ...prev, role } : { id: currentUser.id, email: currentUser.email ?? '', role });
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        appUser,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateRole,
        fetchProfile: refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
