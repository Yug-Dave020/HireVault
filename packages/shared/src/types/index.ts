export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";
export type ContentStatus = "draft" | "approved" | "posted";
export type SubscriptionTier = "free" | "pro" | "elite";

export interface Profile {
  id: string;
  linkedin_id: string | null;
  headline: string | null;
  summary: string | null;
  raw_data: Record<string, unknown> | null;
  voice_profile: VoiceProfile | null;
  ats_score: number | null;
  drift_score: number | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  endorsed_count: number;
  ai_suggested: boolean;
  trend_score: number | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  jd_text: string;
  match_score: number | null;
  human_score: number | null;
  resume_version: Record<string, unknown> | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface SkillTrend {
  id: string;
  skill_name: string;
  role: string;
  location: string;
  frequency: number;
  sampled_at: string;
}

export interface ContentCalendarItem {
  id: string;
  user_id: string;
  post_text: string;
  topic: string;
  scheduled_for: string;
  status: ContentStatus;
  posted_at: string | null;
  linkedin_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceProfile {
  sentence_length: "short" | "medium" | "long" | "mixed";
  formality: "casual" | "semi-formal" | "formal";
  hook_style: "question" | "bold-claim" | "story" | "statistic" | "list";
  signature_phrases: string[];
  emoji_usage: "none" | "minimal" | "moderate" | "heavy";
  analyzed_at: string;
}
