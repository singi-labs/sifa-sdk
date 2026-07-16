import { z } from 'zod';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.volunteering`. */
export const VolunteeringWriteSchema = z.object({
  organization: z.string().min(1).max(256),
  role: z.string().max(256).nullable().optional(),
  cause: z.string().max(256).nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
});

export type VolunteeringWriteInput = z.infer<typeof VolunteeringWriteSchema>;
