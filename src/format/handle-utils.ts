/**
 * Sanitize raw user input into a valid AT Protocol identifier (handle or DID).
 *
 * Handles common mistakes:
 * - Pasting a full Bluesky profile URL
 * - Pasting a raw HTTPS URL to a PDS domain
 * - Using an at:// URI
 * - Prefixing with @
 * - Entering a bare username without .bsky.social
 */
export function sanitizeHandleInput(raw: string): string {
  let identifier = raw
    .trim()
    .replace(/^https?:\/\/bsky\.app\/profile\//i, '')
    .replace(/^at:\/\//i, '')
    .replace(/^@/, '')
    .replace(/^https?:\/\//i, '');
  if (!identifier.startsWith('did:')) {
    identifier = identifier.split('/')[0] ?? identifier;
  }
  identifier = identifier.replace(/\.$/, '');
  if (!identifier.startsWith('did:')) {
    identifier = identifier.toLowerCase();
  }

  // Auto-append .bsky.social for bare usernames (no dots, not a DID)
  if (identifier && !identifier.startsWith('did:') && !identifier.includes('.')) {
    identifier = `${identifier}.bsky.social`;
  }

  return identifier;
}
