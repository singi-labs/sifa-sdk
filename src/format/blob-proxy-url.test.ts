import { describe, expect, it } from 'vitest';

import { blobProxyUrl } from './blob-proxy-url.js';

describe('blobProxyUrl', () => {
  it('builds the sifa-api blob proxy URL with an encoded DID and CID', () => {
    expect(blobProxyUrl('https://sifa.id', 'did:plc:abc', 'bafkcover', 'thumb')).toBe(
      'https://sifa.id/api/blob/did%3Aplc%3Aabc/bafkcover?v=thumb',
    );
  });

  it('strips trailing slashes from the base URL', () => {
    expect(blobProxyUrl('https://sifa.test//', 'did:plc:abc', 'bafkicon', 'avatar')).toBe(
      'https://sifa.test/api/blob/did%3Aplc%3Aabc/bafkicon?v=avatar',
    );
  });
});
