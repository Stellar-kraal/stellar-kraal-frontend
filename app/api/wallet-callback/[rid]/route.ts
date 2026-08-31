import { NextRequest, NextResponse } from 'next/server';
import { putSep7Callback, takeSep7Callback } from '@/lib/sep7CallbackStore';

export const dynamic = 'force-dynamic';

/**
 * SEP-0007 callback endpoint.
 *
 * A mobile wallet that has signed a `web+stellar:tx` request POSTs the
 * signed XDR here (per SEP-7 §"callback"). The frontend polls the GET
 * variant of this route to pick up the result and resume the session.
 */
export async function POST(req: NextRequest, { params }: { params: { rid: string } }) {
  const { rid } = params;
  if (!rid) {
    return NextResponse.json({ error: 'Missing request id' }, { status: 400 });
  }

  let signedXdr: string | null = null;
  let signerAddress: string | null = null;

  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const body = await req.json();
      signedXdr = body.xdr ?? body.tx ?? null;
      signerAddress = body.pubkey ?? null;
    } else {
      // SEP-7 wallets typically POST as multipart/form-data or urlencoded.
      const form = await req.formData();
      signedXdr = (form.get('xdr') as string | null) ?? (form.get('tx') as string | null);
      signerAddress = (form.get('pubkey') as string | null) ?? null;
    }
  } catch {
    return NextResponse.json({ error: 'Malformed callback body' }, { status: 400 });
  }

  if (!signedXdr) {
    return NextResponse.json({ error: 'Missing signed xdr in callback' }, { status: 400 });
  }

  putSep7Callback(rid, signedXdr, signerAddress);
  return NextResponse.json({ ok: true });
}

/** Polled by the frontend while the QR modal is open, waiting for a signature. */
export async function GET(_req: NextRequest, { params }: { params: { rid: string } }) {
  const { rid } = params;
  if (!rid) {
    return NextResponse.json({ error: 'Missing request id' }, { status: 400 });
  }

  const entry = takeSep7Callback(rid);
  if (!entry) {
    return NextResponse.json({ pending: true }, { status: 202 });
  }
  return NextResponse.json({ pending: false, xdr: entry.signedXdr, pubkey: entry.signerAddress });
}
