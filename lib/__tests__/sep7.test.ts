import { buildSep7TxUri, parseSep7TxUri, generateSep7RequestId } from '../sep7';

const SAMPLE_XDR =
  'AAAAAgAAAACx+xkNfIfrCwEUqfWA4WFR7YnSTGl0/JYr0hIySzUiVwAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

describe('buildSep7TxUri', () => {
  it('builds a minimal web+stellar:tx URI with just an xdr', () => {
    const uri = buildSep7TxUri({ xdr: SAMPLE_XDR });
    expect(uri.startsWith('web+stellar:tx?')).toBe(true);
    expect(uri).toContain(`xdr=${encodeURIComponent(SAMPLE_XDR)}`);
  });

  it('includes callback, pubkey, message and origin_domain when provided', () => {
    const uri = buildSep7TxUri({
      xdr: SAMPLE_XDR,
      callbackUrl: 'https://app.example.com/api/wallet-callback/abc123',
      publicKey: 'GBZXM7Y4KY6XG6Y5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5',
      message: 'Fund loan #42',
      originDomain: 'app.example.com',
    });

    const search = new URLSearchParams(uri.split('?')[1]);
    expect(search.get('callback')).toBe('url:https://app.example.com/api/wallet-callback/abc123');
    expect(search.get('pubkey')).toBe('GBZXM7Y4KY6XG6Y5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5');
    expect(search.get('msg')).toBe('Fund loan #42');
    expect(search.get('origin_domain')).toBe('app.example.com');
  });

  it('omits network_passphrase for the public network', () => {
    const uri = buildSep7TxUri({
      xdr: SAMPLE_XDR,
      networkPassphrase: 'Public Global Stellar Network ; September 2016',
    });
    expect(uri).not.toContain('network_passphrase');
  });

  it('includes network_passphrase for non-public networks (e.g. testnet)', () => {
    const uri = buildSep7TxUri({
      xdr: SAMPLE_XDR,
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
    const search = new URLSearchParams(uri.split('?')[1]);
    expect(search.get('network_passphrase')).toBe('Test SDF Network ; September 2015');
  });

  it('throws when xdr is missing', () => {
    // @ts-expect-error deliberately omitting the required field
    expect(() => buildSep7TxUri({})).toThrow();
  });
});

describe('parseSep7TxUri', () => {
  it('round-trips a URI built by buildSep7TxUri', () => {
    const uri = buildSep7TxUri({
      xdr: SAMPLE_XDR,
      callbackUrl: 'https://app.example.com/api/wallet-callback/abc123',
      publicKey: 'GBZXM7Y4KY6XG6Y5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5',
      message: 'Fund loan #42',
    });

    const parsed = parseSep7TxUri(uri);
    expect(parsed.xdr).toBe(SAMPLE_XDR);
    expect(parsed.callbackUrl).toBe('https://app.example.com/api/wallet-callback/abc123');
    expect(parsed.publicKey).toBe('GBZXM7Y4KY6XG6Y5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5X7Z5');
    expect(parsed.message).toBe('Fund loan #42');
  });

  it('rejects non-SEP-7 URIs', () => {
    expect(() => parseSep7TxUri('https://example.com')).toThrow();
  });

  it('rejects a SEP-7 tx URI missing xdr', () => {
    expect(() => parseSep7TxUri('web+stellar:tx?msg=hi')).toThrow();
  });
});

describe('generateSep7RequestId', () => {
  it('generates unique, non-empty ids', () => {
    const a = generateSep7RequestId();
    const b = generateSep7RequestId();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
