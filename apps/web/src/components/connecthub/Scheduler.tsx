import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchedulerProps {
  onProposeTimes: (slots: string[]) => void;
}

export function Scheduler({ onProposeTimes }: SchedulerProps) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  
  // Mock available slots for today and tomorrow
  const mockSlots = [
    { day: "Today", slots: ["14:00", "15:30", "16:00"] },
    { day: "Tomorrow", slots: ["09:00", "11:30", "13:00", "15:00"] }
  ];

  const toggleSlot = (day: string, time: string) => {
    const slotStr = `${day} at ${time}`;
    if (selectedSlots.includes(slotStr)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotStr));
    } else {
      setSelectedSlots([...selectedSlots, slotStr]);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 text-zinc-900 max-w-sm shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-zinc-800 font-semibold">
        <CalendarIcon className="w-5 h-5 text-indigo-600" />
        Propose Interview Times
      </div>
      
      <p className="text-xs text-zinc-500 mb-4">
        Select blocks from your connected calendar to propose to the candidate.
      </p>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
        {mockSlots.map((dayGroup, idx) => (
          <div key={idx}>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{dayGroup.day}</h4>
            <div className="grid grid-cols-2 gap-2">
              {dayGroup.slots.map(time => {
                const slotStr = `${dayGroup.day} at ${time}`;
                const isSelected = selectedSlots.includes(slotStr);
                return (
                  <button
                    key={time}
                    onClick={() => toggleSlot(dayGroup.day, time)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm transition-all border ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-200">
        <Button 
          onClick={() => onProposeTimes(selectedSlots)}
          disabled={selectedSlots.length === 0}
          className="w-full bg-[#1da074] hover:bg-[#15805c] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedSlots.length > 0 ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Propose {selectedSlots.length} Slots
            </span>
          ) : (
            "Select times to propose"
          )}
        </Button>
      </div>
    </div>
  );
}
