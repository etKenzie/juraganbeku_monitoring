'use client';

import type { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  role: string[] | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DASHBOARD_PATH = '/';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string[] | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .single();
        console.log(data)

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      //@ts-ignore
      return data?.roles || null;
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
      if (!supabase) {
        console.error('Supabase client not initialized');
        throw new Error('Authentication service not available');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data);
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        const userRole = await fetchUserRole(data.session.user.id);
        setRole(userRole);
        
        // Wait for session to be properly set
        await supabase.auth.getSession();
        
        // Force a hard navigation to the dashboard
        window.location.href = DASHBOARD_PATH;
      } else {
        throw new Error('No session data received');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setRole(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign out error:', error);
      }

      // More thorough cookie deletion
      const deleteCookie = (name: string, path: string = '/', domain: string = '') => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}`;
      };

      // Delete all possible Supabase cookies
      const cookieNames = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-provider-token',
        'sb-auth-token',
        'sb-user-id',
        'sb-user-role',
        'sb-user-session'
      ];

      // Delete cookies for current domain
      cookieNames.forEach(name => {
        deleteCookie(name);
        deleteCookie(name, '/');
      });

      // Delete cookies for subdomains if any
      const hostname = window.location.hostname;
      if (hostname.includes('.')) {
        const domain = hostname.split('.').slice(-2).join('.');
        cookieNames.forEach(name => {
          deleteCookie(name, '/', `.${domain}`);
        });
      }
      
      localStorage.clear();
      sessionStorage.clear();

      // Clear any remaining Supabase session
      await supabase.auth.getSession();
      
      console.log('Sign out successful');
      
      // Force a hard navigation to sign in page with cache busting
      window.location.href = '/auth/signin?t=' + new Date().getTime();
      
    } catch (error) {
      console.error('Error in sign out process:', error);
      // Even if there's an error, try to redirect to sign in with cache busting
      window.location.href = '/auth/signin?t=' + new Date().getTime();
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