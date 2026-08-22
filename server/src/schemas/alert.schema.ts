import { z } from 'zod';

export const updateAlertSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
    assignedToId: z.string().uuid().optional().nullable(),
    resolutionNotes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid alert ID.'),
  }),
});
