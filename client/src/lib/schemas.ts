import { z } from "zod";

export const termSchema = z.object({
  term: z.string().min(1, "Term is required").max(30, "Term must be less than 30 characters"),
  definition: z.string().min(1, "Definition is required").max(200, "Definition must be less than 200 characters"),
  example: z.string().min(1, "Example is required").max(100, "Example must be less than 100 characters"),
});

export type TermFormData = z.infer<typeof termSchema>;