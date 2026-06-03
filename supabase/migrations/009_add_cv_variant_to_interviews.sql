alter table interview_sessions
add column cv_variant_id uuid references user_cv_variants(id) on delete set null;
