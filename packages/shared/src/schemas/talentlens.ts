import { z } from "zod";

export const CandidateArchetypeSchema = z.enum([
  "Perfect fit",
  "High ceiling",
  "Solid hire",
  "Overqualified",
  "Needs review",
]);

export const CandidateStatusSchema = z.enum([
  "new",
  "shortlisted",
  "contacted",
  "responded",
  "interview_scheduled",
]);

export const ParsedJSONSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  skills: z.array(z.string()),
  roles: z.array(z.string()),
  years_experience: z.number(),
  companies: z.array(z.string()),
  summary: z.string().optional(),
});

export const CVSubmissionSchema = z.object({
  id: z.string().uuid(),
  job_posting_id: z.string().uuid(),
  filename: z.string(),
  anonymized_id: z.string(),
  composite_score: z.number(),
  skills_score: z.number(),
  seniority_score: z.number(),
  trajectory_score: z.number(),
  culture_score: z.number(),
  archetype: CandidateArchetypeSchema,
  status: CandidateStatusSchema,
  parsed_json: ParsedJSONSchema,
  created_at: z.string().datetime(),
});

export const JobPostingSchema = z.object({
  id: z.string().uuid(),
  hiring_manager_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  created_at: z.string().datetime(),
});

export const ScoringWeightsSchema = z.object({
  skills: z.number().min(0).max(100),
  seniority: z.number().min(0).max(100),
  trajectory: z.number().min(0).max(100),
  culture: z.number().min(0).max(100),
}).refine((data) => {
  return (data.skills + data.seniority + data.trajectory + data.culture) === 100;
}, {
  message: "Weights must sum to 100",
});
