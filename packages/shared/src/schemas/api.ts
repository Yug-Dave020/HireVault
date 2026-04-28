import { z } from "zod";

export const GenerateCVRequestSchema = z.object({
  user_id: z.string().uuid(),
  job_listing_id: z.string().uuid(),
});

export const GenerateCVResponseSchema = z.object({
  cv_id: z.string().uuid(),
  ats_score: z.number().int().min(0).max(100),
  human_score: z.number().int().min(0).max(100),
  pdf_url: z.string().url().nullable(),
  docx_url: z.string().url().nullable(),
});

export const AnalyzeJDResponseSchema = z.object({
  required_skills: z.array(z.string()),
  experience_level: z.string(),
  salary_range: z.string().nullable(),
  summary: z.string(),
});

export type GenerateCVRequest = z.infer<typeof GenerateCVRequestSchema>;
export type GenerateCVResponse = z.infer<typeof GenerateCVResponseSchema>;
export type AnalyzeJDResponse = z.infer<typeof AnalyzeJDResponseSchema>;
