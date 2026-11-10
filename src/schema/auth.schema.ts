import * as z from 'zod';

export const LoginRequest = z.object({
    username: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(50, {message: 'Username cannot exceed 50 characters'})
        .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain lowercase letters, uppercase letters, numbers, hyphens and underscores ' }),
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(255, { message: 'Password cannot exceed 255 characters' })
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[!-~]{8,255}$/)
    ,
})

export const RegisterRequest = z.object({
    username: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(50, {message: 'Username cannot exceed 50 characters'})
        .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain lowercase letters, uppercase letters, numbers, hyphens and underscores ' }),
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(255, { message: 'Password cannot exceed 255 characters' })
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[!-~]{8,255}$/)
    ,
})