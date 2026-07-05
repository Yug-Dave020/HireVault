import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

// Read env from apps/web/.env.local manually
const envContent = fs.readFileSync(resolve(__dirname, '.env.local'), 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseServiceKey = '';

for (const line of envLines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("Starting seed process...");

  // 1. Get or create a hiring manager
  let { data: hms } = await supabase.from('hiring_manager_profiles').select('id').limit(1);
  let hmId;

  if (!hms || hms.length === 0) {
    console.log("No hiring manager found. Creating a mock auth user...");
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'manager@hirevault.local',
      password: 'password123',
      email_confirm: true,
    });
    if (authError || !authUser.user) {
      console.error("Failed to create mock auth user:", authError);
      process.exit(1);
    }
    
    const { error: profileError } = await supabase.from('hiring_manager_profiles').insert({
      id: authUser.user.id,
      company_name: 'HireVault Testing Inc.'
    });

    if (profileError) {
      console.error("Failed to create hiring manager profile:", profileError);
      process.exit(1);
    }
    hmId = authUser.user.id;
    console.log("Created mock hiring manager with ID:", hmId);
  } else {
    hmId = hms[0].id;
    console.log("Using existing hiring manager with ID:", hmId);
  }

  // 2. Create Job Posting
  const { data: job, error: jobError } = await supabase.from('job_postings').insert({
    hiring_manager_id: hmId,
    title: 'Senior Full Stack Engineer',
    description: 'Looking for an experienced engineer to build real-time applications.'
  }).select().single();

  if (jobError) throw jobError;
  const jobId = job.id;
  console.log("Created Job Posting:", jobId);

  // 3. Create CV Submissions
  const { data: cv1, error: cv1Error } = await supabase.from('cv_submissions').insert({
    job_posting_id: jobId,
    filename: 'priya_sharma_cv.pdf',
    raw_text: '...',
    parsed_json: { name: 'Priya Sharma', title: 'Senior Backend Engineer', skills: ['Node.js', 'PostgreSQL', 'AWS'] },
    composite_score: 92,
    archetype: 'Senior Architect',
    anonymized_id: 'anon-101'
  }).select().single();
  if (cv1Error) throw cv1Error;

  const { data: cv2, error: cv2Error } = await supabase.from('cv_submissions').insert({
    job_posting_id: jobId,
    filename: 'chen_wei_cv.pdf',
    raw_text: '...',
    parsed_json: { name: 'Chen Wei', title: 'Frontend Architect', skills: ['React', 'TypeScript', 'Next.js'] },
    composite_score: 88,
    archetype: 'Frontend Specialist',
    anonymized_id: 'anon-102'
  }).select().single();
  if (cv2Error) throw cv2Error;

  console.log("Created CV Submissions.");

  // 4. Create Async Video Screens
  await supabase.from('async_video_screens').insert([
    {
      cv_submission_id: cv1.id,
      video_storage_path: 'mock-path-1.mp4',
      status: 'reviewed'
    },
    {
      cv_submission_id: cv2.id,
      video_storage_path: 'mock-path-2.mp4',
      status: 'pending'
    }
  ]);
  console.log("Created Async Video Screens.");

  // 5. Create Conversations
  const { data: conv1, error: conv1Error } = await supabase.from('conversations').insert({
    job_posting_id: jobId,
    hiring_manager_id: hmId,
    cv_submission_id: cv1.id
  }).select().single();
  if (conv1Error) throw conv1Error;

  const { data: conv2, error: conv2Error } = await supabase.from('conversations').insert({
    job_posting_id: jobId,
    hiring_manager_id: hmId,
    cv_submission_id: cv2.id
  }).select().single();
  if (conv2Error) throw conv2Error;
  
  console.log("Created Conversations.");

  // 6. Create Messages
  await supabase.from('messages').insert([
    {
      conversation_id: conv1.id,
      sender_id: hmId,
      content: 'Hi Priya! I saw your video screen and was very impressed. When are you free to chat?',
      is_system_message: false
    },
    {
      conversation_id: conv1.id,
      sender_id: 'system',
      content: 'Candidate viewed your message.',
      is_system_message: true
    },
    {
      conversation_id: conv2.id,
      sender_id: hmId,
      content: 'Hello Chen, we are reviewing your application.',
      is_system_message: false
    }
  ]);

  console.log("Created Messages.");
  console.log("Seeding completed successfully!");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
