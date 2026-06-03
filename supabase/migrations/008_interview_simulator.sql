create table if not exists interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  selected_persona text not null,
  target_position text not null,
  current_stage text not null default 'Intro',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists interview_transcripts (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references interview_sessions on delete cascade not null,
  message_owner text not null, -- 'user' or 'ai'
  content text not null,
  stage text not null,
  feedback_metadata jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table interview_sessions enable row level security;
alter table interview_transcripts enable row level security;

create policy "Users can manage their own interview sessions"
  on interview_sessions
  for all
  using (auth.uid() = user_id);

create policy "Users can manage transcripts for their sessions"
  on interview_transcripts
  for all
  using (
    session_id in (
      select id from interview_sessions where user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_interview_sessions_user on interview_sessions(user_id, created_at desc);
create index if not exists idx_interview_transcripts_session on interview_transcripts(session_id, created_at asc);
