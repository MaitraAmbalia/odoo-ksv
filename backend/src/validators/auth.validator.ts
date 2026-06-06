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
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    userId:      z.string(),
    token:       z.string(),
    newPassword: z.string().min(8),
  }),
});
