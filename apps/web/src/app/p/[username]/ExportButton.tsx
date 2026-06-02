"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ profile }: { profile: any }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          design_prefs: profile.design_prefs || { theme: "modern_minimalist", accent_color: "#1d9e75", font_heading: "Inter", font_body: "Inter" },
        }),
      });

      if (!response.ok) throw new Error("Worker failed to render PDF document.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${(profile.personal?.full_name || "cv").toLowerCase().replace(/\s+/g, "-")}-optimized.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert(err.message || "Export failed. Please check the backend service.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      className="bg-[var(--hv-teal)] hover:bg-[#0f6e56] text-white font-bold h-10 px-6 rounded-xl shadow-md flex items-center gap-2 transition-all mx-auto sm:mx-0"
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download Resume as PDF
    </Button>
  );
}
