'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DASHBOARD_PATH = '/';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        
        if (error) {
          throw error;
        }

        if (session && mounted) {
          console.log('Valid session found:', session);
          setSession(session);
          setUser(session.user);
        } else {
          console.log('No valid session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);

      if (!mounted) return;

      if (session) {
        setSession(session);
        setUser(session.user);
        
        if (event === 'SIGNED_IN') {
          // Ensure the session is refreshed and cookies are set
          await supabase.auth.getSession();
          router.refresh(); // Refresh the page to ensure middleware picks up the new session
          router.push(DASHBOARD_PATH);
        }
      } else {
        setSession(null);
        setUser(null);
        
        if (event === 'SIGNED_OUT') {
          router.push('/auth/signin');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Sign in successful:', data);
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Ensure session is properly set in cookies
        await supabase.auth.getSession();
        router.refresh(); // Refresh the page to ensure middleware picks up the new session
        router.push(DASHBOARD_PATH);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign up...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      console.log('Sign up successful:', data);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      console.log('Sign out successful');
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        session,
        signIn,
        signUp,
        signOut,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 