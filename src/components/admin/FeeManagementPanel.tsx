import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronRight, ChevronLeft, Users, CheckSquare, List, DollarSign, MessageSquare, Clipboard, Calendar, Settings, FileText, Bus, UserCircle, Bell, X, Moon, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { hashPassword } from "@/lib/utils";
import { Student, AdminUserRow } from "./types";
import { SectionTitle, Inp, Sel, PaginationControls, EntriesDropdown } from "./SharedUI";

// ─── FEE MANAGEMENT ──────────────────────────────────────────────────────────
const FeeManagementPanel = () => {
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [tab, setTab] = useState<"student" | "outstanding">("student");
  const [payForm, setPayForm] = useState({ amount: "", date: "", receipt: "", method: "Cash" });
  const [showPay, setShowPay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchStudent = async () => {
    if (!search) return;
    setLoading(true);
    const { data } = await supabase.from("students").select("*").or(`admission_no.ilike.%${search}%,name.ilike.%${search}%`).limit(1).single();
    if (data) {
      setStudent(data as Student);
      const { data: fData } = await supabase.from("fees").select("*").eq("student_id", data.id).order("due_date");
      setFees(fData || []);
    } else {
      toast.error("Student not found."); setStudent(null); setFees([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "outstanding") {
      supabase.from("fees").select("*, students(name,class,admission_no)").eq("status", "Pending").order("due_date").then(({ data }) => setOutstanding(data || []));
    }
  }, [tab]);

  const addPayment = async () => {
    if (!student || !payForm.amount) { toast.error("Fill in amount."); return; }
    setSaving(true);
    const { error } = await supabase.from("fees").insert([{
      student_id: student.id, term: "General", type: "Payment", amount: Number(payForm.amount),
      due_date: payForm.date || new Date().toISOString().split("T")[0], paid_on: payForm.date || new Date().toISOString().split("T")[0],
      status: "Paid",
    }]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment recorded!");
    setShowPay(false); setPayForm({ amount: "", date: "", receipt: "", method: "Cash" });
    const { data: fData } = await supabase.from("fees").select("*").eq("student_id", student.id);
    setFees(fData || []);
  };

  const total = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paid = fees.filter(f => f.status === "Paid").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div>
      <SectionTitle>Fee Management</SectionTitle>
      <div className="flex gap-2 mb-5">
        {(["student", "outstanding"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg ${tab === t ? "bg-[#d4af37] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t === "student" ? "Student Fees" : "Outstanding"}</button>
        ))}
      </div>
      {tab === "student" && (
        <>
          <div className="flex gap-3 mb-4">
            <input type="text" placeholder="Name or admission no." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && searchStudent()} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30" style={{ fontFamily: "Inter,sans-serif" }} />
            <button onClick={searchStudent} className="bg-[#d4af37] text-white font-bold text-xs px-4 py-2 rounded-lg">{loading ? "…" : "Search"}</button>
          </div>
          {student && (
            <>
              <p className="text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{student.name} — {student.class} | Total: ₹{total.toLocaleString()} | Paid: ₹{paid.toLocaleString()} | Due: <span className="text-[#d4af37]">₹{(total - paid).toLocaleString()}</span></p>
              <table className="portal-table mb-4">
                <thead><tr><th>Term</th><th>Type</th><th>Amount</th><th>Due</th><th>Paid On</th><th>Status</th></tr></thead>
                <tbody>
                  {fees.map((f, i) => (
                    <tr key={i}><td>{f.term}</td><td>{f.type}</td><td>₹{Number(f.amount).toLocaleString()}</td><td>{f.due_date}</td><td>{f.paid_on || "—"}</td>
                      <td><span className={f.status === "Paid" ? "status-paid" : "status-pending"}>{f.status}</span></td>
                    </tr>
                  ))}
                  {fees.length === 0 && <tr><td colSpan={6} className="text-center py-3 text-slate-400">No fee records yet.</td></tr>}
                </tbody>
              </table>
              <button onClick={() => setShowPay(v => !v)} className="bg-[#d4af37] text-white font-bold text-xs px-4 py-2 rounded-lg mb-3">+ Add Payment</button>
              {showPay && (
                <div className="border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50 grid sm:grid-cols-2 gap-3">
                  <Inp label="Amount (₹) *" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} type="number" />
                  <Inp label="Date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} type="date" />
                  <Inp label="Receipt No." value={payForm.receipt} onChange={e => setPayForm({ ...payForm, receipt: e.target.value })} />
                  <Sel label="Method" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                    {["Cash", "Online", "Cheque", "DD"].map(m => <option key={m}>{m}</option>)}
                  </Sel>
                  <div className="sm:col-span-2">
                    <button onClick={addPayment} disabled={saving} className="bg-[#d4af37] text-white font-bold text-xs px-5 py-2 rounded-lg disabled:opacity-60">{saving ? "Saving…" : "Save Payment"}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      {tab === "outstanding" && (
        <table className="portal-table">
          <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Type</th><th>Amount</th><th>Due Date</th></tr></thead>
          <tbody>
            {outstanding.map((f, i) => (
              <tr key={f.id}><td>{i + 1}</td><td className="font-medium">{(f.students as any)?.name || "—"}</td><td>{(f.students as any)?.class || "—"}</td><td>{f.type}</td><td className="status-pending font-bold">₹{Number(f.amount).toLocaleString()}</td><td>{f.due_date}</td></tr>
            ))}
            {outstanding.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">No outstanding fees.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
};


export default FeeManagementPanel;
