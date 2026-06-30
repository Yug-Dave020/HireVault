import { Calendar as CalendarIcon, Clock, Video } from "lucide-react";

interface CandidateBookingProps {
  proposedSlots: string[];
  onAcceptSlot: (slot: string) => void;
  onSuggestAnotherTime: () => void;
}

export function CandidateBooking({
  proposedSlots = ["Tomorrow at 11:30", "Tomorrow at 15:00", "Friday at 14:00"],
  onAcceptSlot,
  onSuggestAnotherTime
}: Partial<CandidateBookingProps>) {
  return (
    <div className="bg-zinc-800 border border-zinc-700/50 rounded-xl p-5 text-zinc-100 w-full max-w-sm shadow-xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100">Interview Invite</h3>
          <p className="text-xs text-zinc-400 mt-1">
            The hiring manager has proposed times for a 45-minute video interview.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2 mb-4 border border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Video className="w-4 h-4 text-zinc-500" /> ConnectHub Video
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Clock className="w-4 h-4 text-zinc-500" /> 45 Minutes
        </div>
      </div>

      <div className="space-y-2">
        {proposedSlots.map((slot, idx) => (
          <button
            key={idx}
            onClick={() => onAcceptSlot?.(slot)}
            className="w-full text-left flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors group"
          >
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white">{slot}</span>
            <span className="text-xs font-semibold text-[#1da074] opacity-0 group-hover:opacity-100 transition-opacity">
              Accept
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 text-center">
        <button 
          onClick={onSuggestAnotherTime}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
        >
          None of these work? Suggest another time
        </button>
      </div>
    </div>
  );
}
