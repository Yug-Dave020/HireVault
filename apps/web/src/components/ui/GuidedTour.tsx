"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GuidedTourProps {
  onComplete: () => void;
}

export function GuidedTour({ onComplete }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const slides = [
    {
      title: "Welcome to HireVault",
      description: "Your personalized AI career acceleration dashboard. Let's get you familiar with the platform.",
      image: (
        <div className="bg-indigo-50 w-full h-full rounded-lg flex items-center justify-center">
          <span className="text-4xl">👋</span>
        </div>
      ),
    },
    {
      title: "ATS Optimization Studio",
      description: "Create or import your CV. Our system ensures it is 100% compliant with Applicant Tracking Systems.",
      image: (
        <div className="bg-emerald-50 w-full h-full rounded-lg flex items-center justify-center">
          <span className="text-4xl">📄</span>
        </div>
      ),
    },
    {
      title: "Conversational Trainer",
      description: "Practice interactive mock interviews with our advanced AI trainer.",
      image: (
        <div className="bg-purple-50 w-full h-full rounded-lg flex items-center justify-center">
          <span className="text-4xl">🎙️</span>
        </div>
      ),
    },
    {
      title: "Offer Negotiation Simulator",
      description: "Roleplay compensation negotiation to maximize your earning potential.",
      image: (
        <div className="bg-blue-50 w-full h-full rounded-lg flex items-center justify-center">
          <span className="text-4xl">💰</span>
        </div>
      ),
    }
  ];

  const markCompleted = async () => {
    setIsCompleting(true);
    try {
      // First try localStorage for immediate fallback
      localStorage.setItem('hirevault_tour_completed', 'true');
      
      // Then try DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({ has_completed_tour: true })
          .eq("id", user.id);
      }
    } catch (e) {
      console.error("Failed to update tour status in DB", e);
    } finally {
      setIsCompleting(false);
      onComplete();
    }
  };

  const handleNext = async () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      await markCompleted();
      router.refresh();
    }
  };

  const handleSkip = async () => {
    await markCompleted();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleSkip}
          disabled={isCompleting}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors z-10 bg-white/50 rounded-full hover:bg-zinc-100"
          aria-label="Skip tour"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900">{slides[step].title}</h2>

          <div className="w-full h-[240px] rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center p-2 relative">
            {slides[step].image}
          </div>

          <p className="text-zinc-600 text-[15px] leading-relaxed min-h-[48px]">
            {slides[step].description}
          </p>

          <div className="flex items-center justify-between pt-4 mt-2">
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === step ? "w-6 bg-indigo-600" : "w-2 bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-all disabled:opacity-50"
            >
              {step === slides.length - 1 ? (
                <>
                  {isCompleting ? "Finishing..." : "Get Started"}
                  {!isCompleting && <Check className="h-4 w-4" />}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
