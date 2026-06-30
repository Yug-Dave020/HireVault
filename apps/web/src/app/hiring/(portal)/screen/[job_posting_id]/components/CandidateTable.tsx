"use client";

import { useState } from "react";
import { CVSubmission } from "@shared/types/talentlens";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Search, UserRound } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

interface CandidateTableProps {
  candidates: CVSubmission[];
  anonymized: boolean;
  selectedRowIds: Set<string>;
  setSelectedRowIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRowClick: (id: string) => void;
}

export default function CandidateTable({ candidates, anonymized, selectedRowIds, setSelectedRowIds, onRowClick }: CandidateTableProps) {
  const [search, setSearch] = useState("");
  const [topN, setTopN] = useState(100);
  const [archetypeFilter, setArchetypeFilter] = useState("All");

  const filtered = candidates
    .filter(c => {
      if (archetypeFilter !== "All" && c.archetype !== archetypeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = anonymized ? c.anonymized_id.toLowerCase() : (c.parsed_json.name || "").toLowerCase();
        const role = (c.parsed_json.roles?.[0] || "").toLowerCase();
        return name.includes(q) || role.includes(q) || c.archetype.toLowerCase().includes(q);
      }
      return true;
    })
    .slice(0, topN);

  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const toggleAll = () => {
    if (selectedRowIds.size === filtered.length && filtered.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filtered.map(c => c.id)));
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const archetypeColors: Record<string, string> = {
    "Perfect fit": "bg-green-100 text-green-800",
    "High ceiling": "bg-purple-100 text-purple-800",
    "Solid hire": "bg-teal-100 text-teal-800",
    "Overqualified": "bg-amber-100 text-amber-800",
    "Needs review": "bg-zinc-100 text-zinc-700",
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="p-4 border-b border-zinc-200/60 flex items-center justify-between shrink-0">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="h-9 rounded-md border border-zinc-200 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value)}
          >
            <option value="All">All Archetypes</option>
            <option value="Perfect fit">Perfect fit</option>
            <option value="High ceiling">High ceiling</option>
            <option value="Solid hire">Solid hire</option>
            <option value="Overqualified">Overqualified</option>
            <option value="Needs review">Needs review</option>
          </select>
          <select 
            className="h-9 rounded-md border border-zinc-200 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            <option value={10}>Top 10</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_minmax(200px,1fr)_120px_200px_140px_100px] gap-4 p-4 border-b border-zinc-200/60 bg-zinc-50/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
        <div className="flex items-center justify-center">
          <Checkbox checked={filtered.length > 0 && selectedRowIds.size === filtered.length} onCheckedChange={toggleAll} />
        </div>
        <div>Candidate</div>
        <div>Match</div>
        <div>Dimensions (S / E / T / C)</div>
        <div>Archetype</div>
        <div>Status</div>
      </div>

      {/* Table Body (Virtualized) */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const cv = filtered[virtualRow.index];
            const name = anonymized ? cv.anonymized_id : (cv.parsed_json.name || "Unknown");
            const role = cv.parsed_json.roles?.[0] || "No role specified";
            const isSelected = selectedRowIds.has(cv.id);

            return (
              <div
                key={cv.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`grid grid-cols-[40px_minmax(200px,1fr)_120px_200px_140px_100px] gap-4 px-4 items-center border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                onClick={() => onRowClick(cv.id)}
              >
                <div className="flex items-center justify-center h-full" onClick={(e) => toggleRow(cv.id, e)}>
                  <Checkbox checked={isSelected} />
                </div>
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-zinc-900 truncate">{name}</span>
                    <span className="text-xs text-zinc-500 truncate">{role}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 justify-center">
                  <div className="flex items-end gap-1.5">
                    <span className="text-lg font-bold text-zinc-900 leading-none">{cv.composite_score}</span>
                    <span className="text-[10px] text-zinc-400 font-medium mb-0.5">/ 100</span>
                  </div>
                  <Progress value={cv.composite_score} className="h-1.5" indicatorClassName={getScoreColor(cv.composite_score)} />
                </div>

                <div className="flex items-center gap-2">
                  <TinyScore label="S" val={cv.skills_score} />
                  <TinyScore label="E" val={cv.seniority_score} />
                  <TinyScore label="T" val={cv.trajectory_score} />
                  <TinyScore label="C" val={cv.culture_score} />
                </div>

                <div className="flex items-center">
                  <Badge className={`${archetypeColors[cv.archetype]} hover:${archetypeColors[cv.archetype]} border-0 shadow-none font-semibold text-xs`}>
                    {cv.archetype}
                  </Badge>
                </div>

                <div className="flex items-center">
                  <span className="text-xs font-medium text-zinc-500 capitalize">{cv.status.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TinyScore({ label, val }: { label: string, val: number }) {
  const color = val >= 85 ? "text-green-600" : val >= 70 ? "text-amber-600" : "text-red-500";
  return (
    <div className="flex flex-col items-center w-8" title={`${label}: ${val}`}>
      <span className="text-[9px] font-bold text-zinc-400 mb-0.5">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{Math.round(val)}</span>
    </div>
  );
}
