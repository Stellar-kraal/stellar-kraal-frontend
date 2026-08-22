/**
 * In-memory store for SEP-0007 sign-request callbacks.
 *
 * A mobile wallet that resolves a `web+stellar:tx` deep link POSTs the
 * signed XDR back to the `callback` URL embedded in the request. Since
 * that POST happens out-of-band (from the wallet app, not the browser tab
 * that generated the request), the frontend has to poll a server-side
 * endpoint to pick up the result.
 *
 * NOTE: this is a single-process, in-memory store — it's sufficient for a
 * single Next.js instance (dev, or one container) but will not fan out
 * across multiple replicas. For a horizontally-scaled deployment, back
 * this with a shared store (Redis, etc.) instead.
 */

export type Sep7CallbackEntry = {
  signedXdr: string;
  signerAddress: string | null;
  receivedAt: number;
};

const ENTRY_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches the QR modal's own request timeout

const store = new Map<string, Sep7CallbackEntry>();

function sweepExpired(): void {
  const now = Date.now();
  store.forEach((entry, rid) => {
    if (now - entry.receivedAt > ENTRY_TTL_MS) store.delete(rid);
  });
}

export function putSep7Callback(rid: string, signedXdr: string, signerAddress: string | null): void {
  sweepExpired();
  store.set(rid, { signedXdr, signerAddress, receivedAt: Date.now() });
}

/** Read and consume (delete) a stored callback result, if present. */
export function takeSep7Callback(rid: string): Sep7CallbackEntry | null {
  sweepExpired();
  const entry = store.get(rid);
  if (!entry) return null;
  store.delete(rid);
  return entry;
}
