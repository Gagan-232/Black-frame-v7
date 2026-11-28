import { z } from 'zod';

export const RESERVED = new Set(['admin', 'administrator', 'root', 'system', 'support', 'staff', 'moderator', 'blackframe', 'blackframestudio', 'nightshift']);
export const usernameSchema = z.string().trim()
  .min(3, 'Username must be at least 3 characters.').max(24, 'Username must be at most 24 characters.')
  .regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, numbers and underscores.');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.').max(128, 'Password is too long.');

export const registerSchema = z.object({ username: usernameSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
export const loginSchema = z.object({ username: z.string().trim().min(1, 'Enter your username.').max(64), password: z.string().min(1, 'Enter your password.').max(128), admin: z.boolean().optional() });
export const changePasswordSchema = z.object({ current: z.string().min(1).max(128), next: passwordSchema, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { message: 'Passwords do not match.', path: ['confirm'] });
