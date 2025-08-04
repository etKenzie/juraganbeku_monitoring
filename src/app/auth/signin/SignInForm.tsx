'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

export default function SignInForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    // Check for recovery token first
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('SignInForm: Detected recovery token, redirecting to reset password');
        setHasRecoveryToken(true);
        const resetPasswordUrl = `/auth/reset-password${hash}`;
        router.replace(resetPasswordUrl);
        return;
      }
    }

    // If no recovery token, check authentication
    const checkAuth = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !window.location.hash.includes('access_token')) {
        setShouldRedirect(true);
        router.replace('/');
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  // Show loading state while checking authentication or if redirecting
  if (isCheckingAuth || shouldRedirect || hasRecoveryToken) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography>
          {hasRecoveryToken ? 'Redirecting to reset password...' : 
           shouldRedirect ? 'Redirecting...' : 'Loading...'}
        </Typography>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClientComponentClient<Database>();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setIsResetting(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
      });

      if (error) throw error;

      setMessage('Password reset instructions have been sent to your email');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset password email');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
          {message}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        {/* <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={handleForgotPassword}
            disabled={isResetting}
            sx={{ cursor: 'pointer' }}
          >
            {isResetting ? 'Sending...' : 'Forgot Password?'}
          </Link>
        </Box> */}
      </Box>
    </>
  );
}