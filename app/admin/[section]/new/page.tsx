"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ItemForm, { emptyItem, type Item, type Option } from "@/components/admin/ItemForm";
import { getSection } from "@/lib/adminConfig";
import { fetchOptionsBySection } from "@/lib/adminOptions";
import { resolveStagedImages } from "@/lib/clientImages";

export default function NewItemPage() {
  const { section } = useParams<{ section: string }>();
  const router = useRouter();
  const def = getSection(section);

  const [item, setItem] = useState<Item | null>(() => (def ? emptyItem(def.fields) : null));
  const [optionsBySection, setOptionsBySection] = useState<Record<string, Option[]>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!def) return;
    fetchOptionsBySection(def).then(setOptionsBySection);
  }, [def]);

  if (!def) {
    return (
      <AdminShell title="Not found">
        <p className="text-ink-soft">
          This section does not exist.{" "}
          <Link href="/admin" className="text-accent underline">
            Back to dashboard
          </Link>
        </p>
      </AdminShell>
    );
  }

  if (def.singleton) {
    return (
      <AdminShell title={def.label}>
        <p className="text-ink-soft">
          {def.label} only has one entry.{" "}
          <Link href={`/admin/${def.slug}`} className="text-accent underline">
            Edit it here
          </Link>
          .
        </p>
      </AdminShell>
    );
  }

  async function save() {
    if (!item) return;
    setSaving(true);
    setMsg(null);
    try {
      const resolved = await resolveStagedImages(item);

      const listRes = await fetch(`/api/admin/content?section=${def!.slug}`);
      if (!listRes.ok) throw new Error("Could not load the current list.");
      const { data: existing } = (await listRes.json()) as { data: Item[] };

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: def!.slug, data: [resolved, ...existing] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        setMsg({ ok: false, text: body.error || "Save failed." });
        return;
      }
      router.push(`/admin/${def!.slug}`);
      router.refresh();
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title={`New ${def.label}`}>
      <Link
        href={`/admin/${def.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to {def.label}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">New {def.label}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{def.description}</p>
        </div>
      </div>

      {item === null ? (
        <div className="mt-8 flex items-center gap-2 text-ink-soft text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
          <ItemForm
            fields={def.fields}
            item={item}
            optionsBySection={optionsBySection}
            onChange={setItem}
          />
        </div>
      )}

      <div className="sticky bottom-4 mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(33,31,26,0.10)]">
        <button
          onClick={save}
          disabled={saving || item === null}
          className="inline-flex items-center gap-2 rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save & add"}
        </button>
        <Link
          href={`/admin/${def.slug}`}
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
