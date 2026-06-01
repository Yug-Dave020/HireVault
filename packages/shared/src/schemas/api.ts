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
