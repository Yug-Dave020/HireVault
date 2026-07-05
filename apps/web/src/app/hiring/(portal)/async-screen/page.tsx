"use client";

import { useEffect, useState } from "react";
import { Video, Sparkles, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type ScreenData = {
  id: string;
  candidate: string;
  role: string;
  status: string;
  score: number | null;
  duration: string;
  submitted: string;
  created_at: string;
};

export default function AsyncScreenDashboard() {
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchScreens = async () => {
      setLoading(true);
      // Fetch async_video_screens joined with cv_submissions
      const { data, error } = await supabase
        .from('async_video_screens')
        .select(`
          id,
          status,
          created_at,
          cv_submissions (
            parsed_json,
            composite_score
          )
        `)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const formattedData: ScreenData[] = data.map((item: any) => {
          const parsed = item.cv_submissions?.parsed_json || {};
          return {
            id: item.id,
            candidate: parsed.name || "Unknown Candidate",
            role: parsed.title || "Unknown Role",
            status: item.status,
            score: item.cv_submissions?.composite_score || null,
            duration: "5:00", // Defaulting as duration is not in our mock schema right now
            submitted: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
            created_at: item.created_at
          };
        });
        setScreens(formattedData);
      }
      setLoading(false);
    };

    fetchScreens();

    const channel = supabase.channel('async_screens_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'async_video_screens'
        },
        () => {
          // On any change, re-fetch to get the joined data easily
          fetchScreens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Async Video Screening</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review pre-recorded candidate responses analyzed by ConnectHub AI.
          </p>
        </div>
        <Link href="/hiring/async-screen/new">
          <Button className="bg-[#1da074] hover:bg-[#15805c] text-white">
            <Video className="w-4 h-4 mr-2" />
            Create New Screening Request
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : screens.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <Video className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900">No screening requests</h3>
          <p className="text-zinc-500 mt-2">You haven&apos;t requested any async video screens yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map(screen => (
            <div key={screen.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {screen.candidate.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{screen.candidate}</h3>
                    <p className="text-xs text-zinc-500">{screen.role}</p>
                  </div>
                </div>
                {screen.score ? (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-100">
                    {screen.score}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 text-amber-600 font-bold text-sm border border-amber-100">
                    <Clock className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-600 mb-6 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-zinc-400" />
                  {screen.duration}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  {screen.submitted}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-100 flex gap-3">
                <Link href={`/hiring/async-screen/${screen.id}`} className="flex-1">
                  <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
                    Watch & Review
                  </Button>
                </Link>
                {screen.score && (
                  <Button variant="outline" size="icon" className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
