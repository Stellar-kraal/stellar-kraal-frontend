'use client';
import { useState } from 'react';
import { useFreighter } from '@/lib/useFreighter';
import { useMobileWallet } from '@/lib/useMobileWallet';
import { MobileWalletModal } from '@/components/MobileWalletModal';

export function WalletButton() {
  const { publicKey: freighterKey, isConnecting, connect } = useFreighter();
  const mobileWallet = useMobileWallet();
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const publicKey = freighterKey ?? mobileWallet.publicKey;

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
    <div className="flex items-center gap-2">
      <button
        id="btn-connect-wallet"
        onClick={connect}
        disabled={isConnecting}
        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl text-sm font-semibold text-black transition-all duration-200 hover:scale-105"
      >
        {isConnecting ? 'Connecting...' : 'Connect Freighter'}
      </button>
      <button
        id="btn-connect-mobile-wallet"
        onClick={() => setIsMobileModalOpen(true)}
        className="px-5 py-2.5 bg-transparent border border-amber-500/60 hover:border-amber-400 rounded-xl text-sm font-semibold text-amber-400 transition-all duration-200 hover:scale-105"
      >
        Connect Mobile Wallet
      </button>
      <MobileWalletModal isOpen={isMobileModalOpen} onClose={() => setIsMobileModalOpen(false)} />
    </div>
  );
}
