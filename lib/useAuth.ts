'use client';
/**
 * useAuth — stub for JWT auth via wallet signature.
 *
 * Full flow:
 *  1. User connects Freighter wallet (publicKey obtained via useFreighter).
 *  2. Backend issues a challenge XDR for the user to sign.
 *  3. Signed XDR + publicKey + role sent to POST /api/auth/login.
 *  4. Backend verifies signature and returns a JWT.
 *  5. Token stored in module-level var via setToken(); cleared on logout.
 */
import { useState, useCallback } from 'react';
import { login, setToken, clearToken } from '@/lib/api';
import { useFreighter } from '@/lib/useFreighter';

export type AuthState = {
  token: string | null;
  role: string | null;
  isAuthenticating: boolean;
  error: string | null;
  authenticate: (role: 'farmer' | 'investor') => Promise<void>;
  logout: () => void;
};

export function useAuth(): AuthState {
  const { publicKey, sign } = useFreighter();
  const [token, setLocalToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(
    async (selectedRole: 'farmer' | 'investor') => {
      if (!publicKey) {
        setError('Wallet not connected');
        return;
      }
      setIsAuthenticating(true);
      setError(null);
      try {
        // TODO: fetch challenge XDR from backend and sign it.
        // For now we pass an empty string as a placeholder.
        const signedTxXdr = await sign('', process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? '');
        const res = await login({ publicKey, signedTxXdr, role: selectedRole });
        setToken(res.token);
        setLocalToken(res.token);
        setRole(res.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    },
    [publicKey, sign],
  );

  const logout = useCallback(() => {
    clearToken();
    setLocalToken(null);
    setRole(null);
  }, []);

  return { token, role, isAuthenticating, error, authenticate, logout };
}
