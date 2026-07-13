'use client';
import { useState, useCallback } from 'react';
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
} from '@stellar/freighter-api';

export type FreighterState = {
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  sign: (xdr: string, network: string) => Promise<string>;
};

export function useFreighter(): FreighterState {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // v3: isConnected() returns { isConnected: boolean, error? }
      const connectedResult = await isConnected();
      if (connectedResult.error) throw new Error(connectedResult.error);

      if (!connectedResult.isConnected) {
        // Prompt user to allow the dapp in Freighter
        const allowResult = await setAllowed();
        if (allowResult.error) throw new Error(allowResult.error);
      }

      // v3: getAddress() replaced getPublicKey(), returns { address: string, error? }
      const addressResult = await getAddress();
      if (addressResult.error) throw new Error(addressResult.error);
      setPublicKey(addressResult.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const sign = useCallback(
    async (xdr: string, network: string): Promise<string> => {
      const result = await signTransaction(xdr, { networkPassphrase: network });
      if (result.error) throw new Error(result.error);
      return result.signedTxXdr;
    },
    [],
  );

  return { publicKey, isConnecting, error, connect, sign };
}
