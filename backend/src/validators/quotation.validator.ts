import { z } from 'zod';

export const createQuotationSchema = z.object({
  body: z.object({
    deliveryDays:  z.number().int().positive(),
    gstRate:       z.number().min(0).max(28).default(18),
    taxType:       z.enum(['GST_INTRA', 'GST_INTER']).default('GST_INTRA'),
    notes:         z.string().optional(),
    paymentTerms:  z.string().optional(),
    items: z.array(z.object({
      rfqItemId:  z.string().uuid(),
      unitPrice:  z.number().positive(),
    })).min(1),
  }),
});
