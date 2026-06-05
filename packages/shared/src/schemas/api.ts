import { z } from "zod";

export const CVPersonalSchema = z.object({
  full_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export const CVExperienceItemSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const CVEducationItemSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().nullable().optional(),
  start_year: z.string(),
  end_year: z.string().nullable().optional(),
  gpa: z.string().nullable().optional(),
});

export const CVProjectItemSchema = z.object({
  name: z.string(),
  url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tech_stack: z.array(z.string()).default([]),
});

export const CVLanguageItemSchema = z.object({
  name: z.string(),
  level: z.string(), // e.g. Native, Fluent, Intermediate
});

export const CVSkillsSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  languages: z.array(CVLanguageItemSchema).default([]),
});

export const CVDesignPrefsSchema = z.object({
  theme: z.enum(["classic_executive", "modern_minimalist", "tech_professional"]).default("modern_minimalist"),
  accent_color: z.string().default("#1d9e75"),
  font_heading: z.string().default("Inter"),
  font_body: z.string().default("Inter"),
});

export const CVProfileSchema = z.object({
  personal: CVPersonalSchema.default({}),
  experience: z.array(CVExperienceItemSchema).default([]),
  education: z.array(CVEducationItemSchema).default([]),
  projects: z.array(CVProjectItemSchema).default([]),
  skills: CVSkillsSchema.default({ technical: [], soft: [], languages: [] }),
  target_roles: z.array(z.string()).default([]),
  design_prefs: CVDesignPrefsSchema.default({
    theme: "modern_minimalist",
    accent_color: "#1d9e75",
    font_heading: "Inter",
    font_body: "Inter",
  }),
});

export const ParseResumeResponseSchema = z.object({
  profile: CVProfileSchema,
});

export const ExportPDFRequestSchema = z.object({
  profile: CVProfileSchema,
  design_prefs: CVDesignPrefsSchema,
});

export type CVPersonal = z.infer<typeof CVPersonalSchema>;
export type CVExperienceItem = z.infer<typeof CVExperienceItemSchema>;
export type CVEducationItem = z.infer<typeof CVEducationItemSchema>;
export type CVProjectItem = z.infer<typeof CVProjectItemSchema>;
export type CVLanguageItem = z.infer<typeof CVLanguageItemSchema>;
export type CVSkills = z.infer<typeof CVSkillsSchema>;
export type CVDesignPrefs = z.infer<typeof CVDesignPrefsSchema>;
export type CVProfile = z.infer<typeof CVProfileSchema>;

export type ParseResumeResponse = z.infer<typeof ParseResumeResponseSchema>;
export type ExportPDFRequest = z.infer<typeof ExportPDFRequestSchema>;

export const CVSkillOrphanSchema = z.object({
  skill: z.string(),
  suggestion: z.string()
});

export const CVExperienceUnderclaimedSchema = z.object({
  term: z.string(),
  found_in: z.string()
});

export const CVImpactGapSchema = z.object({
  bullet: z.string(),
  rewrite_suggestion: z.string()
});

export const CVTimelineFlagSchema = z.object({
  role: z.string(),
  issue: z.string()
});

export const CVSeniorityMismatchSchema = z.object({
  role: z.string(),
  issue: z.string()
});

export const CVCoherenceReportSchema = z.object({
  score: z.number().int().min(0).max(100),
  skill_orphans: z.array(CVSkillOrphanSchema),
  experience_underclaimed: z.array(CVExperienceUnderclaimedSchema),
  impact_gap: z.array(CVImpactGapSchema),
  timeline_flags: z.array(CVTimelineFlagSchema),
  seniority_mismatch: z.array(CVSeniorityMismatchSchema),
  keyword_density_flag: z.boolean()
});

export type CVCoherenceReport = z.infer<typeof CVCoherenceReportSchema>;
export type CVSkillOrphan = z.infer<typeof CVSkillOrphanSchema>;
export type CVExperienceUnderclaimed = z.infer<typeof CVExperienceUnderclaimedSchema>;
export type CVImpactGap = z.infer<typeof CVImpactGapSchema>;
export type CVTimelineFlag = z.infer<typeof CVTimelineFlagSchema>;
export type CVSeniorityMismatch = z.infer<typeof CVSeniorityMismatchSchema>;

export const CVRedTeamAttackSchema = z.object({
  target_section: z.string(),
  target_text: z.string(),
  attack_type: z.enum(['vague', 'unverifiable', 'keyword_stuffed', 'buzzword', 'gap']),
  severity: z.number().int().min(1).max(3),
  attack_reasoning: z.string()
});

export const CVRedTeamPatchSchema = z.object({
  original: z.string(),
  patched_version: z.string(),
  reasoning: z.string()
});

export const CVRedTeamReportSchema = z.object({
  attack_surface_score: z.number().int(),
  attacks: z.array(CVRedTeamAttackSchema),
  patches: z.array(CVRedTeamPatchSchema)
});

export type CVRedTeamAttack = z.infer<typeof CVRedTeamAttackSchema>;
export type CVRedTeamPatch = z.infer<typeof CVRedTeamPatchSchema>;
export type CVRedTeamReport = z.infer<typeof CVRedTeamReportSchema>;

export const JDSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  company_name: z.string(),
  role_title: z.string(),
  source_url: z.string(),
  scraped_text: z.string(),
  drifts: z.array(z.string()),
  created_at: z.string().optional()
});

export type JDSnapshot = z.infer<typeof JDSnapshotSchema>;

export const NegotiationTurnRequestSchema = z.object({
  session_id: z.string().uuid(),
  user_message: z.string(),
  current_offer: z.number().int()
});

export const NegotiationTurnResponseSchema = z.object({
  ai_response: z.string(),
  new_offer: z.number().int(),
  feedback_score: z.number().int().min(1).max(100)
});

export type NegotiationTurnRequest = z.infer<typeof NegotiationTurnRequestSchema>;
export type NegotiationTurnResponse = z.infer<typeof NegotiationTurnResponseSchema>;
