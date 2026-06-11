"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CreateJobModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error: dbError } = await supabase
        .from("job_postings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          hiring_manager_id: session.user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setOpen(false);
      setTitle("");
      setDescription("");
      router.refresh();
      
      // Optionally redirect straight to the new job
      // router.push(`/hiring/screen/${data.id}`);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium h-10 px-5 gap-2 rounded-lg">
            <Plus className="h-4 w-4" />
            New Job Posting
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-zinc-200">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl text-zinc-900">Create New Job Posting</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Add the role title and the full job description. This will be used to automatically score and rank candidate CVs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-zinc-900">Job Title</label>
              <input
                id="title"
                className="w-full flex h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-900">Job Description</label>
              <Textarea
                id="description"
                placeholder="Paste the full job description here..."
                className="min-h-[200px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
        
        <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="bg-white">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Posting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
