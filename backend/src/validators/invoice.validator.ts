import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    poId:    z.string().uuid(),
    dueDate: z.string().datetime(),
    taxType: z.enum(['GST_INTRA', 'GST_INTER']).default('GST_INTRA'),
    gstRate: z.number().min(0).max(28).default(18),
    notes:   z.string().optional(),
  }),
});
