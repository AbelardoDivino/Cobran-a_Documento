const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  officeName: z.string().optional().default(''),
  accountType: z.enum(['personal', 'business']).optional().default('personal'),
  companyCnpj: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const googleSchema = z.object({
  idToken: z.string().min(1),
  accountType: z.enum(['personal', 'business']).optional(),
  officeName: z.string().optional().default(''),
  companyCnpj: z.string().optional().default(''),
});

module.exports = { registerSchema, loginSchema, refreshSchema, googleSchema };
