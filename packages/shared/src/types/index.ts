import { CVProfile, CVDesignPrefs } from "../schemas/api";

export interface UserProfile {
  id: string;
  full_name: string | null;
  target_roles: string[] | null;
  target_locations: string[] | null;
  skills: string[] | null;
  experience_years: number | null;
  education: Record<string, unknown> | null;
  experience: Record<string, unknown> | null;
  languages: string[] | null;
  salary_expectation: string | null;
  voice_profile: VoiceProfile | null;
  updated_at: string;
  // CV v2 additions:
  cv_profile?: CVProfile | null;
  design_prefs?: CVDesignPrefs | null;
  parse_mode?: "uploaded" | "scratch" | null;
}

export interface GeneratedCV {
  id: string;
  user_id: string;
  cv_content: Record<string, unknown> | null;
  pdf_url: string | null;
  docx_url: string | null;
  ats_score: number | null;
  human_score: number | null;
  cover_letter: string | null;
  created_at: string;
}

export interface VoiceProfile {
  sentence_length: "short" | "medium" | "long" | "mixed";
  formality: "casual" | "semi-formal" | "formal";
  hook_style: "question" | "bold-claim" | "story" | "statistic" | "list";
  signature_phrases: string[];
  emoji_usage: "none" | "minimal" | "moderate" | "heavy";
  analyzed_at: string;
}

export * from "../schemas/api";
