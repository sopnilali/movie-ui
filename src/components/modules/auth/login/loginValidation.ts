import { z } from "zod";

export const loginValidation = z.object({
  email: z.string(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password must not exceed 20 characters"),
});
