import { z } from 'zod';

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address')
      .max(255, 'Email must be at most 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

export function parseRegisterForm(
  values: RegisterFormValues,
):
  | { success: true; data: RegisterFormValues }
  | { success: false; errors: RegisterFieldErrors } {
  const result = registerFormSchema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: RegisterFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof RegisterFormValues | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}
