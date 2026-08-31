/**
 * SEP-0007 URI helpers.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
 *
 * SEP-0007 defines a `web+stellar:` URI scheme that mobile Stellar wallets
 * (Lobstr, etc.) register as a handler for. It is used here as a fallback
 * deep-link for signing requests when a WalletConnect session is not
 * available (e.g. the connected wallet only supports SEP-7).
 */

export type Sep7TxParams = {
  /** Base64-encoded transaction envelope XDR to be signed. */
  xdr: string;
  /** Where the wallet should POST the signed XDR back to, e.g. `https://app.example.com/api/wallet-callback/<rid>`. */
  callbackUrl?: string;
  /** The account the transaction is expected to be signed by. */
  publicKey?: string;
  /** Short human-readable message shown to the user in their wallet. */
  message?: string;
  /** Network passphrase, only needed when it differs from the Stellar public network. */
  networkPassphrase?: string;
  /** Domain of the application originating the request, used for SEP-7 origin verification. */
  originDomain?: string;
};

const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2016';

/** Build a `web+stellar:tx` URI requesting a signature for a transaction envelope. */
export function buildSep7TxUri(params: Sep7TxParams): string {
  if (!params.xdr) throw new Error('buildSep7TxUri: xdr is required');

  const search = new URLSearchParams();
  search.set('xdr', params.xdr);

  if (params.callbackUrl) search.set('callback', `url:${params.callbackUrl}`);
  if (params.publicKey) search.set('pubkey', params.publicKey);
  if (params.message) search.set('msg', params.message.slice(0, 300));
  if (params.originDomain) search.set('origin_domain', params.originDomain);
  if (params.networkPassphrase && params.networkPassphrase !== PUBLIC_NETWORK_PASSPHRASE) {
    search.set('network_passphrase', params.networkPassphrase);
  }

  return `web+stellar:tx?${search.toString()}`;
}

export type Sep7ParsedTx = {
  xdr: string;
  callbackUrl: string | null;
  publicKey: string | null;
  message: string | null;
  networkPassphrase: string | null;
  originDomain: string | null;
};

/** Parse a `web+stellar:tx` URI back into its components (used by tests / the callback route). */
export function parseSep7TxUri(uri: string): Sep7ParsedTx {
  if (!uri.startsWith('web+stellar:tx?')) {
    throw new Error('parseSep7TxUri: not a SEP-7 tx URI');
  }
  const search = new URLSearchParams(uri.slice('web+stellar:tx?'.length));
  const xdr = search.get('xdr');
  if (!xdr) throw new Error('parseSep7TxUri: missing xdr param');

  const callback = search.get('callback');
  return {
    xdr,
    callbackUrl: callback?.startsWith('url:') ? callback.slice('url:'.length) : callback,
    publicKey: search.get('pubkey'),
    message: search.get('msg'),
    networkPassphrase: search.get('network_passphrase'),
    originDomain: search.get('origin_domain'),
  };
}

/** Generate a short random id to correlate a SEP-7 sign request with its callback response. */
export function generateSep7RequestId(): string {
  // crypto.randomUUID is available in all modern browsers and Node 18+.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
