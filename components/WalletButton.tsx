'use client';
import { useFreighter } from '@/lib/useFreighter';

export function WalletButton() {
  const { publicKey, isConnecting, connect } = useFreighter();

  const truncate = (key: string) =>
    `${key.slice(0, 6)}...${key.slice(-4)}`;

  if (publicKey) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/40 border border-green-700/40 text-green-400 text-sm font-mono">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        {truncate(publicKey)}
      </div>
    );
  }

  return (
    <button
      id="btn-connect-wallet"
      onClick={connect}
      disabled={isConnecting}
      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl text-sm font-semibold text-black transition-all duration-200 hover:scale-105"
    >
      {isConnecting ? 'Connecting...' : 'Connect Freighter'}
    </button>
  );
}
