import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronRight, ChevronLeft, Users, CheckSquare, List, DollarSign, MessageSquare, Clipboard, Calendar, Settings, FileText, Bus, UserCircle, Bell, X, Moon, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { hashPassword } from "@/lib/utils";
import { Student, AdminUserRow } from "./types";
import { SectionTitle, Inp, Sel, PaginationControls, EntriesDropdown } from "./SharedUI";

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const AnnouncementsPanel = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", audience: "All" });
  const [saving, setSaving] = useState(false);
  const { adminUser } = useAuth();

  useEffect(() => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
  }, []);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from("announcements").insert([{ ...form, posted_by: adminUser?.name }]).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement posted!");
    setAnnouncements([data, ...announcements]);
    setForm({ title: "", message: "", audience: "All" });
  };

  const del = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success("Deleted.");
  };

  return (
    <div>
      <SectionTitle>Announcements</SectionTitle>
      <form onSubmit={post} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>New Announcement</p>
        <Inp label="Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Message *</label>
          <textarea required rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" style={{ fontFamily: "Inter,sans-serif" }} />
        </div>
        <Sel label="Audience" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
          {["All", "Pre-KG", "LKG", "UKG", "All Parents", "All Staff"].map(a => <option key={a}>{a}</option>)}
        </Sel>
        <button type="submit" disabled={saving} className="bg-[#d4af37] text-white font-bold text-xs px-5 py-2.5 rounded-lg disabled:opacity-60">{saving ? "Posting…" : "Post Announcement"}</button>
      </form>
      <div className="divide-y divide-slate-100">
        {announcements.map(a => (
          <div key={a.id} className="py-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5" style={{ fontFamily: "Inter,sans-serif" }}>{new Date(a.created_at).toLocaleDateString("en-GB")} · {a.audience}</p>
              <p className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{a.title}</p>
              <p className="text-slate-500 text-xs mt-0.5" style={{ fontFamily: "Inter,sans-serif" }}>{a.message}</p>
            </div>
            <button onClick={() => del(a.id)} className="text-red-400 text-xs font-medium hover:underline flex-shrink-0">Delete</button>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-slate-400 text-sm py-4">No announcements yet.</p>}
      </div>
    </div>
  );
};


export default AnnouncementsPanel;
