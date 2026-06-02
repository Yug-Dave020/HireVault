import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExportButton } from "./ExportButton";
import { MapPin, Mail, Phone, ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage(props: { params: any }) {
  const params = await props.params;
  const username = params.username;
  const supabase = await createClient();

  const { data: userProf } = await supabase
    .from("user_cv_variants")
    .select("cv_profile")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (!userProf || !userProf.cv_profile) {
    notFound();
  }

  const profile = userProf.cv_profile;
  const { personal, experience, education, projects, skills } = profile;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <header className="bg-slate-900 text-white p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                {personal?.full_name || "Anonymous Professional"}
              </h1>
              {personal?.summary && (
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mt-4">
                  {personal.summary}
                </p>
              )}
            </div>
            <div className="shrink-0 flex items-center">
              <ExportButton profile={profile} />
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-400 font-medium">
            {personal?.location && (
              <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-500" /> {personal.location}</div>
            )}
            {personal?.email && (
              <div className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-500" /> <a href={`mailto:${personal.email}`} className="hover:text-white transition-colors">{personal.email}</a></div>
            )}
            {personal?.phone && (
              <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-500" /> {personal.phone}</div>
            )}
            {personal?.linkedin_url && (
              <div className="flex items-center gap-1.5"><ExternalLink className="h-4 w-4 text-slate-500" /> <a href={personal.linkedin_url.startsWith('http') ? personal.linkedin_url : `https://${personal.linkedin_url}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a></div>
            )}
            {personal?.website_url && (
              <div className="flex items-center gap-1.5"><ExternalLink className="h-4 w-4 text-slate-500" /> <a href={personal.website_url.startsWith('http') ? personal.website_url : `https://${personal.website_url}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Portfolio</a></div>
            )}
          </div>
        </header>

        <main className="p-8 sm:p-12 space-y-12">
          {/* Experience */}
          {experience && experience.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                Work Experience
              </h2>
              <div className="space-y-8">
                {experience.map((exp: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-1">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{exp.title}</h3>
                        <div className="text-[var(--hv-teal)] font-bold text-sm">{exp.company}</div>
                      </div>
                      <div className="text-sm font-medium text-slate-500 shrink-0 text-left sm:text-right">
                        <div>{exp.start_date} — {exp.is_current ? "Present" : exp.end_date}</div>
                        {exp.location && <div className="text-slate-400 text-xs mt-0.5">{exp.location}</div>}
                      </div>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-3 space-y-2 list-disc list-outside ml-4 text-sm text-slate-600 leading-relaxed">
                        {exp.bullets.map((bullet: string, bIdx: number) => (
                          <li key={bIdx} className="pl-1">{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                Education
              </h2>
              <div className="space-y-6">
                {education.map((edu: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1 gap-1">
                      <h3 className="text-base font-bold text-slate-900">{edu.institution}</h3>
                      <div className="text-sm font-medium text-slate-500 shrink-0">
                        {edu.start_year} — {edu.end_year || "Present"}
                      </div>
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{edu.degree}</span> in {edu.field}
                    </div>
                    {edu.gpa && <div className="text-xs text-slate-500 mt-1">GPA: {edu.gpa}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                Notable Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                      {proj.name}
                      {proj.url && (
                        <a href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[var(--hv-teal)] transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </h3>
                    {proj.description && <p className="text-sm text-slate-600 leading-relaxed mb-4">{proj.description}</p>}
                    {proj.tech_stack && proj.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {proj.tech_stack.map((tech: string, tIdx: number) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md shadow-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skills && (skills.technical?.length > 0 || skills.soft?.length > 0) && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                Skills & Expertise
              </h2>
              <div className="space-y-4">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.technical.map((skill: string, sIdx: number) => (
                        <span key={sIdx} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.soft.map((skill: string, sIdx: number) => (
                        <span key={sIdx} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.languages && skills.languages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.languages.map((lang: any, lIdx: number) => (
                        <span key={lIdx} className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg">
                          {lang.name} <span className="opacity-60 text-xs ml-1">({lang.level})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
