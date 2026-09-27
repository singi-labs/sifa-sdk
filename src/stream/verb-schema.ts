import { z } from 'zod';

import { STREAM_VERBS } from './verbs.js';

/**
 * Zod enum for a {@link StreamVerb}, shared with the view-model schema.
 *
 * Kept apart from `verbs.ts` so code that only maps collections to verbs does
 * not load zod.
 */
export const streamVerbSchema = z.enum(STREAM_VERBS);
