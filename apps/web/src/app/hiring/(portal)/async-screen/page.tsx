import { Video, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AsyncScreenDashboard() {
  const screens = [
    {
      id: "1",
      candidate: "Priya Sharma",
      role: "Senior Backend Engineer",
      status: "reviewed",
      score: 92,
      duration: "4:15",
      submitted: "2 hours ago"
    },
    {
      id: "2",
      candidate: "Chen Wei",
      role: "Frontend Architect",
      status: "pending",
      score: null,
      duration: "3:40",
      submitted: "5 hours ago"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Async Video Screening</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review pre-recorded candidate responses analyzed by ConnectHub AI.
          </p>
        </div>
        <Button className="bg-[#1da074] hover:bg-[#15805c] text-white">
          <Video className="w-4 h-4 mr-2" />
          Create New Screening Request
        </Button>
      </div>

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
              <Button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white">
                Watch & Review
              </Button>
              {screen.score && (
                <Button variant="outline" size="icon" className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
