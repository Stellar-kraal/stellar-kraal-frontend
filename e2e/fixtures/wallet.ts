/**
 * Test Wallet Fixture
 *
 * Provides a deterministic Soroban sandbox wallet for E2E tests by mocking
 * the Freighter browser extension at the `window.postMessage` level.
 *
 * The Freighter API v3 communicates with the extension via:
 *   1. `window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_REQUEST", ... })`
 *   2. Listening for responses with `source: "FREIGHTER_EXTERNAL_MSG_RESPONSE"`
 *   3. `isConnected()` returns `{ isConnected: window.freighter }` when
 *      `window.freighter` is truthy (shortcut we exploit).
 *
 * Our mock intercepts step 1 and synthesises step 2 so the app never needs
 * a real Freighter extension.
 */

import type { Page } from '@playwright/test';

// ── Deterministic sandbox keypair ─────────────────────────────────────
export const TEST_WALLET = {
  publicKey: 'GBZXM7Y4KY6XG6Y5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5',
  secretKey: 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  balanceStroops: 100_000_000_000, // 10,000 USDC (7 decimals)
};

// ── Freighter message types (extracted from freighter-api source) ─────
const MSG_TYPES = {
  REQUEST_PUBLIC_KEY: 'REQUEST_PUBLIC_KEY',
  REQUEST_NETWORK: 'REQUEST_NETWORK',
  REQUEST_NETWORK_DETAILS: 'REQUEST_NETWORK_DETAILS',
  REQUEST_CONNECTION_STATUS: 'REQUEST_CONNECTION_STATUS',
  SET_ALLOWED_STATUS: 'SET_ALLOWED_STATUS',
  SUBMIT_TRANSACTION: 'SUBMIT_TRANSACTION',
  SUBMIT_TOKEN: 'SUBMIT_TOKEN',
  REQUEST_ACCESS: 'REQUEST_ACCESS',
  REQUEST_ALLOWED_STATUS: 'REQUEST_ALLOWED_STATUS',
} as const;

/**
 * Returns JavaScript source that installs a Freighter mock via
 * addInitScript. This runs *before* the app bundle loads.
 */
export function freighterMockScript(
  options: {
    rejectConnect?: boolean;
    rejectSign?: boolean;
    emptyBalance?: boolean;
  } = {},
): string {
  const pk = TEST_WALLET.publicKey;
  const rejectConnect = options.rejectConnect ?? false;
  const rejectSign = options.rejectSign ?? false;

  return `
    (() => {
      // ── Step 1: let isConnected() shortcut through ──────────────
      // isConnected() checks window.freighter first; if truthy,
      // it returns immediately without postMessage.
      window.freighter = true;

      // ── Step 2: intercept Freighter postMessage requests ─────────
      const originalPostMessage = window.postMessage.bind(window);

      // Respond to FREIGHTER_EXTERNAL_MSG_REQUEST with the right data.
      window.addEventListener('message', function(e) {
        if (e.source !== window) return;
        if (!e.data || e.data.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') return;

        const msg = e.data;
        var response = null;

        switch (msg.type) {
          case 'REQUEST_PUBLIC_KEY':
            if (${rejectConnect}) {
              response = { publicKey: '', apiError: { code: -1, message: 'User rejected connection' } };
            } else {
              response = { publicKey: '${pk}' };
            }
            break;

          case 'SET_ALLOWED_STATUS':
            if (${rejectConnect}) {
              response = { isAllowed: false, apiError: { code: -1, message: 'User rejected connection' } };
            } else {
              response = { isAllowed: true };
            }
            break;

          case 'REQUEST_ALLOWED_STATUS':
            response = { isAllowed: true };
            break;

          case 'REQUEST_CONNECTION_STATUS':
            response = { isConnected: true };
            break;

          case 'REQUEST_NETWORK':
            response = { network: 'TESTNET', networkPassphrase: 'Test SDF Network ; September 2015' };
            break;

          case 'REQUEST_NETWORK_DETAILS':
            response = {
              networkDetails: {
                network: 'TESTNET',
                networkName: 'Testnet',
                networkUrl: 'https://soroban-testnet.stellar.org',
                networkPassphrase: 'Test SDF Network ; September 2015',
                sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
              }
            };
            break;

          case 'SUBMIT_TRANSACTION':
            if (${rejectSign}) {
              response = { signedTransaction: '', signerAddress: '', apiError: { code: -1, message: 'User declined signing' } };
            } else {
              response = {
                signedTransaction: msg.transactionXdr || 'AAAAAGmhCueUYkT1qB7YHqyqJ3v3J3v3J3v3J3v3J3v3J3v3',
                signerAddress: '${pk}',
              };
            }
            break;

          case 'REQUEST_ACCESS':
            response = { publicKey: '${pk}' };
            break;

          default:
            // Unknown type — respond with empty to avoid hanging promises
            response = {};
        }

        if (response) {
          window.postMessage({
            source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE',
            messagedId: msg.messageId,
            ...response,
          }, window.location.origin);
        }
      }, false);

      // ── Expose mock state for test introspection ─────────────────
      window.__E2E_WALLET__ = {
        publicKey: '${pk}',
        isConnected: true,
        rejectConnect: ${rejectConnect},
        rejectSign: ${rejectSign},
      };

      console.log('[E2E] Freighter mock installed (postMessage level)');
    })();
  `;
}

/**
 * Apply the mock to a Playwright page via addInitScript.
 */
export async function setupWalletOnPage(
  page: Page,
  options?: {
    rejectConnect?: boolean;
    rejectSign?: boolean;
  },
): Promise<void> {
  await page.addInitScript(
    freighterMockScript({
      rejectConnect: options?.rejectConnect,
      rejectSign: options?.rejectSign,
    }),
  );
}
