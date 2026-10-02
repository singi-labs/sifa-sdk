const WORK_ID = /^(?:https:\/\/openalex\.org\/)?(W\d+)$/;

/**
 * The openalex.org page for an OpenAlex work id (`W2741809807`, or the full
 * `https://openalex.org/W2741809807` the API returns). A citation count links
 * here so a reader can see where the number comes from. Anything that is not a
 * work id returns `undefined`, so the caller renders the count without a link.
 */
export function openAlexWorkUrl(id: string | undefined): string | undefined {
  const match = id ? WORK_ID.exec(id.trim()) : null;
  return match ? `https://openalex.org/${match[1]}` : undefined;
}
