import { z } from "zod";

export const AnalyzeResumeRequestSchema = z.object({
  profile_id: z.string().uuid(),
  jd_text: z.string().min(50).max(10000),
});

export const AnalyzeResumeResponseSchema = z.object({
  ats_score: z.number().int().min(0).max(100),
  human_score: z.number().int().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.object({
    skill: z.string(),
    appears_n_times: z.number().int().positive(),
    importance: z.enum(["critical", "important", "nice-to-have"]),
  })),
  quantification_gaps: z.array(z.string()),
  improved_headline: z.string().max(220),
  improved_summary: z.string().max(2000),
});

export const VoiceProfileSchema = z.object({
  sentence_length: z.enum(["short", "medium", "long", "mixed"]),
  formality: z.enum(["casual", "semi-formal", "formal"]),
  hook_style: z.enum(["question", "bold-claim", "story", "statistic", "list"]),
  signature_phrases: z.array(z.string()).max(10),
  emoji_usage: z.enum(["none", "minimal", "moderate", "heavy"]),
  analyzed_at: z.string().datetime(),
});

export const GeneratePostRequestSchema = z.object({
  profile_id: z.string().uuid(),
  topic: z.string().min(5).max(200),
  voice_profile: VoiceProfileSchema,
});

export const GeneratePostResponseSchema = z.object({
  post_text: z.string().min(50).max(3000),
  word_count: z.number().int().positive(),
  estimated_engagement: z.enum(["low", "medium", "high"]),
});

export type AnalyzeResumeRequest = z.infer<typeof AnalyzeResumeRequestSchema>;
export type AnalyzeResumeResponse = z.infer<typeof AnalyzeResumeResponseSchema>;
export type GeneratePostRequest = z.infer<typeof GeneratePostRequestSchema>;
export type GeneratePostResponse = z.infer<typeof GeneratePostResponseSchema>;
