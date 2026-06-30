"use client";

import { CandidateBooking } from "@/components/connecthub/CandidateBooking";

export default function CandidatePreviewPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">ConnectHub (Candidate View)</h1>
      <p className="text-zinc-600 mb-8">
        This is a preview of the candidate&apos;s dashboard when a hiring manager sends them an interview request.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">Pending Requests</h2>
          <CandidateBooking 
            onAcceptSlot={(slot) => alert(`You accepted: ${slot}`)}
            onSuggestAnotherTime={() => alert("Suggest another time clicked.")}
          />
        </div>
        
        <div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-2">Why ConnectHub?</h3>
            <p className="text-sm text-zinc-600">
              Unlike traditional tracking systems where you wait days for a calendly link in your email, 
              ConnectHub lets you accept an interview directly inside your portal with zero friction. 
              The video room will automatically spin up right here when it&apos;s time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
