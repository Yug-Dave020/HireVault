import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import CreateJobModal from "./CreateJobModal";

export const dynamic = "force-dynamic";

export default async function HiringDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/hiring/login");
  }

  // Fetch job postings
  const { data: jobs } = await supabase
    .from("job_postings")
    .select(`
      id, 
      title, 
      created_at,
      cv_submissions(id, composite_score)
    `)
    .eq("hiring_manager_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Job Postings</h1>
          <p className="text-zinc-500 mt-1">Manage your active recruitment pipelines and analyze candidates.</p>
        </div>
        <CreateJobModal />
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-4">
            <BriefcaseIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No active job postings</h3>
          <p className="text-zinc-500 max-w-sm">Create your first job posting to start uploading and analyzing candidate CVs with TalentLens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => {
            const cvs = job.cv_submissions || [];
            const topMatch = cvs.length > 0 ? Math.max(...cvs.map((c: any) => c.composite_score || 0)) : 0;
            
            return (
              <div key={job.id} className="bg-white rounded-xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                <div className="p-6 flex-1">
                  <h3 className="text-lg font-bold text-zinc-900 mb-4 line-clamp-2">{job.title}</h3>
                  
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">CVs Analyzed</span>
                      <div className="flex items-center gap-2 text-zinc-900 font-semibold">
                        <Users className="h-4 w-4 text-indigo-500" />
                        {cvs.length}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Top Match</span>
                      <div className="flex items-center gap-2 font-semibold">
                        <div className={`h-2 w-2 rounded-full ${topMatch >= 85 ? 'bg-green-500' : topMatch >= 70 ? 'bg-amber-500' : topMatch > 0 ? 'bg-red-500' : 'bg-zinc-300'}`} />
                        {topMatch > 0 ? `${topMatch}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                  <Link 
                    href={`/hiring/screen/${job.id}`}
                    className="flex items-center justify-center w-full gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-100 hover:border-indigo-200 rounded-lg py-2 transition-colors shadow-sm"
                  >
                    Open TalentLens <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
