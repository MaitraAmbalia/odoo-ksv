import { z } from 'zod';

export const createRFQSchema = z.object({
  body: z.object({
    title:       z.string().min(1),
    category:    z.string().min(1),
    description: z.string().optional(),
    deadline:    z.string().datetime(),
    items: z.array(z.object({
      itemName:    z.string().min(1),
      description: z.string().optional(),
      quantity:    z.number().int().positive(),
      unit:        z.string().min(1),
    })).min(1, 'At least one item required'),
    vendorIds: z.array(z.string().uuid()).optional().default([]),
  }),
});
