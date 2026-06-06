import { z } from 'zod';

export const approvalActionSchema = z.object({
  body: z.object({
    remarks: z.string().optional(),
  }),
});
