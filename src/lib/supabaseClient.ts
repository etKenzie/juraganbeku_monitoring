import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a custom fetch function with retry logic
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const maxRetries = 3;
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeout = 30000; // 30 seconds timeout
      const controller = new AbortController();
      const { signal } = controller;

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(input, {
        ...init,
        signal,
      }).finally(() => clearTimeout(timeoutId));

      // If the response is ok, return it immediately
      if (response.ok) {
        return response;
      }

      // If we get a 400 or 401, don't retry
      if (response.status === 400 || response.status === 401) {
        return response;
      }

      // For other errors, throw to trigger retry
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error;
      // If it's the last retry, throw the error
      if (i === maxRetries - 1) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
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
          const value = localStorage.getItem(key);
          return Promise.resolve(value);
        } catch (error) {
          console.warn('Error reading from localStorage:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.warn('Error writing to localStorage:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
          return Promise.resolve();
        }
      }
    },
    debug: process.env.NODE_ENV === 'development'
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