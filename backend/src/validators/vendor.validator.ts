import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    userId:       z.string().uuid(),
    companyName:  z.string().min(1),
    category:     z.string().min(1),
    gstNumber:    z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number'),
    contactPhone: z.string().min(10),
    address:      z.string().optional(),
  }),
});
