import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a custom fetch function with timeout
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const timeout = 30000; // 30 seconds timeout
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(input, {
    ...init,
    signal,
  }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key))
        } catch (error) {
          return Promise.resolve(null)
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
          return Promise.resolve()
        } catch (error) {
          return Promise.resolve()
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
          return Promise.resolve()
        } catch (error) {
          return Promise.resolve()
        }
      }
    }
  },
  global: {
    headers: {
      'x-application-name': 'tokopandai'
    },
    fetch: customFetch
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}) 