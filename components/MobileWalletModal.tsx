'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMobileWallet } from '@/lib/useMobileWallet';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Tab = 'walletconnect' | 'sep7';

/**
 * Mobile wallet connect modal.
 *
 * Offers two ways for a mobile wallet to pair with the dapp without a
 * browser extension:
 *  - WalletConnect v2 (preferred): scanning the QR establishes a live
 *    session that can request signatures directly.
 *  - SEP-0007 (fallback): a `web+stellar:tx` deep link / QR for wallets
 *    that don't support WalletConnect yet (e.g. Lobstr).
 */
export function MobileWalletModal({ isOpen, onClose }: Props) {
  const wallet = useMobileWallet();
  const [tab, setTab] = useState<Tab>(wallet.isWalletConnectAvailable ? 'walletconnect' : 'sep7');
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'walletconnect' && wallet.isWalletConnectAvailable && wallet.status === 'idle') {
      wallet.connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen) return;
    if (wallet.status === 'connected') {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.status, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sep7Preview = 'web+stellar:tx?xdr=<pending-transaction>';
  const displayUri = tab === 'walletconnect' ? wallet.wcUri : sep7Preview;

  const handleCopy = async () => {
    if (!displayUri) return;
    try {
      await navigator.clipboard.writeText(displayUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — copy button just won't confirm
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-wallet-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111a11] border border-green-800/50 rounded-2xl p-8 w-full max-w-sm focus:outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="mobile-wallet-modal-title" className="font-['Outfit'] text-2xl font-bold text-white">
            Connect Mobile Wallet
          </h2>
          <button
            id="btn-close-mobile-wallet-modal"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-5" role="tablist" aria-label="Mobile wallet connection method">
          <button
            id="tab-walletconnect"
            role="tab"
            aria-selected={tab === 'walletconnect'}
            onClick={() => setTab('walletconnect')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              tab === 'walletconnect'
                ? 'bg-amber-500 text-black'
                : 'bg-green-900/30 text-gray-300 hover:text-white'
            }`}
          >
            WalletConnect
          </button>
          <button
            id="tab-sep7"
            role="tab"
            aria-selected={tab === 'sep7'}
            onClick={() => setTab('sep7')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              tab === 'sep7' ? 'bg-amber-500 text-black' : 'bg-green-900/30 text-gray-300 hover:text-white'
            }`}
          >
            SEP-0007
          </button>
        </div>

        {tab === 'walletconnect' && (
          <div className="flex flex-col items-center gap-4">
            {!wallet.isWalletConnectAvailable ? (
              <p className="text-sm text-amber-400 text-center" role="alert">
                WalletConnect is not configured for this deployment. Use the SEP-0007 tab instead.
              </p>
            ) : wallet.status === 'error' ? (
              <p className="text-sm text-red-400 text-center" role="alert">
                {wallet.error || 'Could not start a WalletConnect session.'}
              </p>
            ) : wallet.wcUri ? (
              <>
                <div className="bg-white p-3 rounded-xl" data-testid="wc-qr-code">
                  <QRCodeSVG value={wallet.wcUri} size={220} title="WalletConnect pairing QR code" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Scan with a WalletConnect-compatible Stellar wallet to connect.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400" aria-live="polite">
                Generating pairing request…
              </p>
            )}
          </div>
        )}

        {tab === 'sep7' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400 text-center">
              SEP-0007 deep links are generated per-transaction. Connect via WalletConnect above for a
              persistent session, or scan a SEP-0007 QR when prompted to sign a specific transaction
              (e.g. registering an animal or funding a loan).
            </p>
            <a
              href="https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/sep-0007-uri-scheme"
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-amber-400 underline"
            >
              Learn more about SEP-0007
            </a>
          </div>
        )}

        {tab === 'walletconnect' && wallet.wcUri && (
          <button
            id="btn-copy-wallet-uri"
            onClick={handleCopy}
            className="mt-5 w-full py-2.5 border border-green-900/50 rounded-xl text-sm text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {copied ? 'Copied!' : 'Copy connection link'}
          </button>
        )}
      </div>
    </div>
  );
}
