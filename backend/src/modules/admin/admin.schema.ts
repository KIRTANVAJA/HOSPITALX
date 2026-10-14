import { z } from 'zod';

export const auditLogFilterSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
