'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type SignClient from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';
import { buildSep7TxUri, generateSep7RequestId } from './sep7';

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const STELLAR_CHAIN = process.env.NEXT_PUBLIC_NETWORK === 'PUBLIC' ? 'stellar:pubnet' : 'stellar:testnet';
const SESSION_STORAGE_KEY = 'stellar-kraal:mobile-wallet-session';
const SEP7_POLL_INTERVAL_MS = 2_000;
const SEP7_TIMEOUT_MS = 5 * 60 * 1000;

type StoredSession = { topic: string; publicKey: string };

export type MobileWalletStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type MobileWalletState = {
  status: MobileWalletStatus;
  /** WalletConnect pairing URI to render as a QR code, once `connect()` has been called. */
  wcUri: string | null;
  /** Whether WalletConnect is configured at all (a Cloud project id is required). */
  isWalletConnectAvailable: boolean;
  publicKey: string | null;
  error: string | null;
  /** Start a WalletConnect pairing. Resolves once the pairing URI is ready (not once approved). */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sign an XDR transaction envelope over the active WalletConnect session. */
  signViaWalletConnect: (xdr: string) => Promise<string>;
  /**
   * Build a SEP-0007 sign request and poll for the wallet's callback response.
   * Returns the `web+stellar:tx` URI immediately for display as a QR code /
   * deep link, and a promise that resolves with the signed XDR once the
   * wallet posts it back (or rejects on timeout).
   */
  signViaSep7: (xdr: string, message?: string) => { uri: string; result: Promise<string> };
};

function loadStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session: StoredSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

/** Lazily create (and cache) the singleton WalletConnect SignClient. */
let signClientPromise: Promise<SignClient> | null = null;
function getSignClient(): Promise<SignClient> {
  if (!signClientPromise) {
    signClientPromise = import('@walletconnect/sign-client').then(({ default: SignClient }) =>
      SignClient.init({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: 'StellarKraal',
          description: 'Livestock-backed DeFi on Stellar',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://stellarkraal.app',
          icons: [],
        },
      }),
    );
  }
  return signClientPromise;
}

export function useMobileWallet(): MobileWalletState {
  const [status, setStatus] = useState<MobileWalletStatus>('idle');
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<SessionTypes.Struct | null>(null);

  // Restore a previously-approved session (e.g. after a page refresh).
  useEffect(() => {
    if (!WC_PROJECT_ID) return;
    const stored = loadStoredSession();
    if (!stored) return;

    let cancelled = false;
    getSignClient()
      .then((client) => {
        if (cancelled) return;
        const session = client.session.get(stored.topic);
        if (session) {
          sessionRef.current = session;
          setPublicKey(stored.publicKey);
          setStatus('connected');
        } else {
          saveStoredSession(null);
        }
      })
      .catch(() => {
        // Relay unreachable / bad session — fall back to a clean slate.
        saveStoredSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!WC_PROJECT_ID) {
      setStatus('error');
      setError('WalletConnect is not configured (missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).');
      return;
    }

    setStatus('connecting');
    try {
      const client = await getSignClient();
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          stellar: {
            chains: [STELLAR_CHAIN],
            methods: ['stellar_signXDR', 'stellar_signAndSubmitXDR'],
            events: [],
          },
        },
      });

      if (uri) setWcUri(uri);

      const session = await approval();
      sessionRef.current = session;

      const account = session.namespaces.stellar?.accounts?.[0];
      // CAIP-10 account id: "stellar:testnet:G...".
      const address = account?.split(':')[2] ?? null;

      setPublicKey(address);
      setStatus('connected');
      setWcUri(null);
      if (address) saveStoredSession({ topic: session.topic, publicKey: address });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to establish WalletConnect session');
      setWcUri(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    setPublicKey(null);
    setStatus('idle');
    setWcUri(null);
    saveStoredSession(null);
    if (session && WC_PROJECT_ID) {
      try {
        const client = await getSignClient();
        await client.disconnect({
          topic: session.topic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      } catch {
        // best-effort — local state is already cleared
      }
    }
  }, []);

  const signViaWalletConnect = useCallback(async (xdr: string): Promise<string> => {
    const session = sessionRef.current;
    if (!session) throw new Error('No active WalletConnect session to sign with');

    const client = await getSignClient();
    const result = await client.request<{ signedXDR: string }>({
      topic: session.topic,
      chainId: STELLAR_CHAIN,
      request: { method: 'stellar_signXDR', params: { xdr } },
    });
    if (!result?.signedXDR) throw new Error('Wallet did not return a signed transaction');
    return result.signedXDR;
  }, []);

  const signViaSep7 = useCallback((xdr: string, message?: string) => {
    const rid = generateSep7RequestId();
    const callbackUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/api/wallet-callback/${rid}` : undefined;

    const uri = buildSep7TxUri({
      xdr,
      callbackUrl,
      message,
      publicKey: publicKey ?? undefined,
      networkPassphrase: NETWORK_PASSPHRASE,
      originDomain: typeof window !== 'undefined' ? window.location.hostname : undefined,
    });

    const result = new Promise<string>((resolve, reject) => {
      const startedAt = Date.now();
      const interval = setInterval(async () => {
        if (Date.now() - startedAt > SEP7_TIMEOUT_MS) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for the wallet to sign this transaction'));
          return;
        }
        try {
          const res = await fetch(`/api/wallet-callback/${rid}`, { cache: 'no-store' });
          if (res.status === 202) return; // still pending
          const body = await res.json();
          if (body.xdr) {
            clearInterval(interval);
            resolve(body.xdr);
          }
        } catch {
          // transient network error while polling — keep trying until timeout
        }
      }, SEP7_POLL_INTERVAL_MS);
    });

    return { uri, result };
  }, [publicKey]);

  return {
    status,
    wcUri,
    isWalletConnectAvailable: Boolean(WC_PROJECT_ID),
    publicKey,
    error,
    connect,
    disconnect,
    signViaWalletConnect,
    signViaSep7,
  };
}
