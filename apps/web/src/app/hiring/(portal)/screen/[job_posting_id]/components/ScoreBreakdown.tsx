"use client";

import { CVSubmission } from "@hirevault/shared";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

export default function ScoreBreakdown({ candidate }: { candidate: CVSubmission }) {
  const archetypeExplanations: Record<string, string> = {
    "Perfect fit": "Candidate meets or exceeds all core requirements and shows strong cultural alignment.",
    "High ceiling": "Candidate may lack some specific experience but shows exceptional potential and fast learning trajectory.",
    "Solid hire": "Candidate is a safe, reliable choice with standard matching experience.",
    "Overqualified": "Candidate's seniority level significantly exceeds the role requirements.",
    "Needs review": "Candidate has a mixed profile that requires human intuition to assess properly.",
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <ScoreCard 
          label="Skills Match" 
          score={candidate.skills_score} 
          description="How well their technical and soft skills align with the JD requirements."
        />
        <ScoreCard 
          label="Seniority Alignment" 
          score={candidate.seniority_score} 
          description="Matches their years of experience and level of responsibility to the role."
        />
        <ScoreCard 
          label="Career Trajectory" 
          score={candidate.trajectory_score} 
          description="Evaluates their promotion velocity and impact progression over time."
        />
        <ScoreCard 
          label="Culture Fit" 
          score={candidate.culture_score} 
          description="Assesses how their background aligns with the implied company culture."
        />
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Archetype: {candidate.archetype}</h4>
          <p className="text-sm text-blue-700">{archetypeExplanations[candidate.archetype]}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, description }: { label: string, score: number, description: string }) {
  const color = score >= 85 ? "bg-green-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 85 ? "text-green-600" : score >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-zinc-900">{label}</h4>
        <span className={`text-xl font-black ${textColor}`}>{score}</span>
      </div>
      <Progress value={score} className="h-2 mb-3" indicatorClassName={color} />
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
