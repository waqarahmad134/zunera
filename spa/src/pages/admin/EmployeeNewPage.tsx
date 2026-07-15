import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import EmployeeForm, { type EmployeeFormValue } from "@/components/EmployeeForm";
import { api, ApiError } from "@/lib/api";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY: EmployeeFormValue = {
  name: "",
  phone: "",
  role: "",
  salary: "",
  joinedDate: today(),
  status: "active",
  password: "",
  notes: "",
};

export default function EmployeeNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<EmployeeFormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!form.name.trim()) {
      setMsg({ ok: false, text: "Name is required." });
      return;
    }
    if (!form.role.trim()) {
      setMsg({ ok: false, text: "Role is required." });
      return;
    }
    if (!form.salary || Number(form.salary) <= 0) {
      setMsg({ ok: false, text: "Enter a salary." });
      return;
    }
    if (!form.joinedDate) {
      setMsg({ ok: false, text: "Pick a joining date." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await api.post("/admin/employees", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        salary: form.salary,
        joinedDate: form.joinedDate,
        status: form.status,
        password: form.password,
        notes: form.notes.trim() || null,
      });
      navigate("/admin/employees");
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New employee">
      <Link
        to="/admin/employees"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Employees
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New employee</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Add a driver or staff member.</p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <EmployeeForm value={form} onChange={setForm} editing={false} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save employee"}
        </button>
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-accent hover:text-accent transition-colors"
        >
          Cancel
        </Link>
        {msg && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              msg.ok ? "text-green-700" : "text-red-600"
            }`}
          >
            {msg.ok ? <Check size={14} /> : <TriangleAlert size={14} />}
            {msg.text}
          </span>
        )}
      </div>
    </AdminShell>
  );
}
