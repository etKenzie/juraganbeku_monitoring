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
  signOut: () => Promise<void>;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DASHBOARD_PATH = '/';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      //@ts-ignore
      return data?.role || null;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        
        if (error) throw error;

        if (session && mounted) {
          console.log('Valid session found:', session);
          setSession(session);
          setUser(session.user);
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        } else {
          console.log('No valid session found');
          setSession(null);
          setUser(null);
          setRole(null);
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

    return () => {
      mounted = false;
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
        const userRole = await fetchUserRole(data.session.user.id);
        setRole(userRole);
        
        await supabase.auth.getSession();
        router.refresh();
        router.push(DASHBOARD_PATH);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
  
      console.log('Sign out successful');
      setUser(null);
      setSession(null);
      setRole(null);
      
      router.refresh();
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
        signOut,
        loading,
        role
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