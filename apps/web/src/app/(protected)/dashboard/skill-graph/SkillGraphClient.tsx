"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, Network, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export function SkillGraphClient({ userId }: { userId: string }) {
  const [graphData, setGraphData] = useState<any>(null);
  const [tabularData, setTabularData] = useState<{variantName: string, skills: string[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const baseUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:8000";
        
        const headers: Record<string, string> = {};
        if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

        const res = await fetch(`${baseUrl}/analyze/skill-topology?user_id=${userId}`, {
          headers
        });
        const data = await res.json();
        
        // Enhance node labels to show variant connections
        data.nodes.forEach((node: any) => {
          if (node.group === 2) {
            // Find all variant IDs this skill is linked to
            const connectedVariants = data.links
              .filter((l: any) => l.target === node.id || (l.target && l.target.id === node.id))
              .map((l: any) => typeof l.source === 'object' ? l.source.id : l.source);
            
            // Map those IDs back to variant names
            const variantNames = connectedVariants.map((vId: string) => {
              const variantNode = data.nodes.find((n: any) => n.id === vId);
              return variantNode ? variantNode.name : "Unknown Variant";
            });
            
            if (variantNames.length > 0) {
              node.tooltipLabel = `${node.name} --> ${variantNames.join(", ")}`;
            } else {
              node.tooltipLabel = node.name;
            }
          } else {
            node.tooltipLabel = node.name;
          }
        });

        // Compute Tabular Data
        const tData: any[] = [];
        const variantNodes = data.nodes.filter((n: any) => n.group === 1);
        variantNodes.forEach((vNode: any) => {
          const connectedSkillIds = data.links
            .filter((l: any) => l.source === vNode.id || (l.source && l.source.id === vNode.id))
            .map((l: any) => typeof l.target === 'object' ? l.target.id : l.target);
            
          const skillNames = connectedSkillIds.map((sId: string) => {
            const skillNode = data.nodes.find((n: any) => n.id === sId);
            return skillNode ? skillNode.name : "";
          }).filter(Boolean);
          
          tData.push({ variantName: vNode.name, skills: skillNames });
        });
        setTabularData(tData);

        setGraphData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTopology();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a91f0]" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#ffffff] min-h-[calc(100vh-64px)] flex flex-col text-[#0f141e]">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Network className="h-8 w-8 text-[#1a91f0]" /> Cross-Resume Skill Topology
        </h1>
        <p className="text-zinc-500 mt-1">Visualize how your skills map across all your CV variants.</p>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6">
        <div className="flex-[2] flex flex-col gap-4">
          <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-[24px] overflow-hidden relative min-h-[600px] shadow-inner" ref={containerRef}>
            {!graphData || graphData.nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-400">
                <Network className="h-12 w-12 mb-4" />
                <p>No CV variants or skills found.</p>
              </div>
            ) : (
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel="tooltipLabel"
                nodeVal={(node: any) => node.group === 1 ? 10 : 3}
                nodeColor={(node: any) => node.group === 1 ? "#1a91f0" : "#1D9E75"}
                nodeRelSize={6}
                linkColor={() => "rgba(148, 163, 184, 0.4)"}
                linkWidth={1.5}
                linkCurvature={0.2}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "#1a91f0"}
                linkDirectionalParticleSpeed={0.005}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const label = node.name;
                  const fontSize = node.group === 1 ? 14 / globalScale : 11 / globalScale;
                  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                  
                  // Use nodeVal internally defined by ForceGraph2D
                  // We provided nodeVal above, so radius = Math.sqrt(node.val) * nodeRelSize
                  const nodeVal = node.group === 1 ? 10 : 3;
                  const nodeR = Math.sqrt(Math.max(0, nodeVal)) * 6;

                  // Draw circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false);
                  ctx.fillStyle = node.group === 1 ? "#1a91f0" : "#1D9E75";
                  ctx.fill();

                  // Only show text if globalScale is high enough, or if it's a variant node
                  if (node.group === 1 || globalScale > 1.2) {
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                    // Draw Background for text
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(
                      node.x - bckgDimensions[0] / 2, 
                      node.y + nodeR + 2, 
                      bckgDimensions[0], 
                      bckgDimensions[1],
                      4 / globalScale
                    );
                    ctx.fill();
                    
                    // Draw Text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.group === 1 ? '#0f141e' : '#4f4f4f';
                    ctx.fillText(label, node.x, node.y + nodeR + 2 + bckgDimensions[1] / 2);
                  }
                }}
              />
            )}
          </div>
          
          <div className="flex gap-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1a91f0]"></div>
              <span className="text-sm font-medium text-zinc-600">CV Variants</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1D9E75]"></div>
              <span className="text-sm font-medium text-zinc-600">Skills</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-zinc-200 rounded-[24px] p-6 overflow-y-auto max-h-[640px] shadow-sm flex flex-col gap-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-800 border-b border-zinc-100 pb-4">
            <FileText className="h-5 w-5 text-zinc-400" /> Tabular Skill Mapping
          </h2>
          {tabularData.length === 0 ? (
            <p className="text-sm text-zinc-500">No variant data available.</p>
          ) : (
            <div className="space-y-6">
              {tabularData.map((item, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-[15px] text-zinc-800">{item.variantName}</h3>
                  {item.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.skills.map((skill, j) => (
                        <span key={j} className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-[#1D9E75]/10 text-[#16805d] border border-[#1D9E75]/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No skills mapped.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
