export type JobBoard = "indeed" | "stepstone" | "xing" | "glassdoor";

export interface JobListing {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  board: JobBoard | null;
  jd_raw: string | null;
  jd_analyzed: Record<string, unknown> | null;
  required_skills: string[] | null;
  experience_level: string | null;
  salary_range: string | null;
  posted_at: string | null;
  scraped_at: string;
  url: string | null;
}

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
}

export interface GeneratedCV {
  id: string;
  user_id: string;
  job_listing_id: string;
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
