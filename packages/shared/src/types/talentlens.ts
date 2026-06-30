export type CandidateArchetype =
  | 'Perfect fit'
  | 'High ceiling'
  | 'Solid hire'
  | 'Overqualified'
  | 'Needs review';

export type CandidateStatus =
  | 'new'
  | 'shortlisted'
  | 'contacted'
  | 'responded'
  | 'interview_scheduled';

export interface CVSubmission {
  id: string;
  job_posting_id: string;
  filename: string;
  anonymized_id: string;
  composite_score: number;
  skills_score: number;
  seniority_score: number;
  trajectory_score: number;
  culture_score: number;
  archetype: CandidateArchetype;
  status: CandidateStatus;
  parsed_json: {
    name?: string;
    email?: string;
    skills: string[];
    roles: string[];
    years_experience: number;
    companies: string[];
    summary?: string;
  };
  created_at: string;
}

export interface JobPosting {
  id: string;
  hiring_manager_id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface ScoringWeights {
  skills: number;
  seniority: number;
  trajectory: number;
  culture: number;
}
