import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName:  z.string().min(1),
    lastName:   z.string().min(1),
    email:      z.string().email(),
    password:   z.string().min(8),
    phone:      z.string().optional(),
    country:    z.string().optional(),
    role:       z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR']),
    avatar:     z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
});
