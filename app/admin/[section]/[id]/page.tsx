"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ItemForm, { emptyItem, type Item, type Option } from "@/components/admin/ItemForm";
import { getSection } from "@/lib/adminConfig";
import { resolveStagedImages } from "@/lib/clientImages";

export default function ItemEditPage() {
  const router = useRouter();
  const { section, id } = useParams<{ section: string; id: string }>();
  const def = getSection(section);
  const isNew = id === "new";
  const index = isNew ? -1 : Number(id);

  const [list, setList] = useState<Item[] | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [optionsBySection, setOptionsBySection] = useState<Record<string, Option[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!def) return;
    const res = await fetch(`/api/admin/content?section=${def.slug}`);
    if (res.ok) {
      const rows = (await res.json()).data as Item[];
      setList(rows);
      if (isNew) {
        setItem(emptyItem(def.fields));
      } else if (rows[index]) {
        setItem(rows[index]);
      } else {
        setItem(null); // out of range
      }
    }

    for (const f of def.fields) {
      if (!f.optionsFrom) continue;
      const r = await fetch(`/api/admin/content?section=${f.optionsFrom}`);
      if (!r.ok) continue;
      const { data: opts } = await r.json();
      setOptionsBySection((prev) => ({
        ...prev,
        [f.optionsFrom!]: (opts as Item[]).map((o) => ({
          value: String(o[f.optionValue ?? "slug"]),
          label: String(o[f.optionLabel ?? "name"]),
        })),
      }));
    }
  }, [def, isNew, index]);

  useEffect(() => {
    load();
  }, [load]);

  if (!def || def.singleton) {
    return (
      <AdminShell title="Not found">
        <p className="text-ink-soft">
          This page does not exist.{" "}
          <Link href="/admin" className="text-accent underline">
            Back to dashboard
          </Link>
        </p>
      </AdminShell>
    );
  }

  const backHref = `/admin/${def.slug}`;

  async function save() {
    if (!item || !def) return;
    setSaving(true);
    setMsg(null);
    try {
      // Re-fetch to avoid clobbering concurrent edits, then merge this item in.
      const res0 = await fetch(`/api/admin/content?section=${def.slug}`);
      const current = res0.ok ? ((await res0.json()).data as Item[]) : (list ?? []);

      const resolvedItem = await resolveStagedImages(item);
      const next = [...current];
      if (isNew) next.push(resolvedItem);
      else if (index >= 0 && index < next.length) next[index] = resolvedItem;
      else next.push(resolvedItem);

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: def.slug, data: next }),
      });
      const body = await res.json().catch(() => ({}));
      setSaving(false);
      if (res.ok) {
        setDirty(false);
        router.push(backHref);
        router.refresh();
      } else {
        setMsg({ ok: false, text: body.error || "Save failed." });
      }
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  async function remove() {
    if (isNew || !def) {
      router.push(backHref);
      return;
    }
    const title = String(item?.[def.itemTitleKey] || "").trim() || "this item";
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setSaving(true);
    const res0 = await fetch(`/api/admin/content?section=${def.slug}`);
    const current = res0.ok ? ((await res0.json()).data as Item[]) : (list ?? []);
    const next = current.filter((_, i) => i !== index);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: def.slug, data: next }),
    });
    setSaving(false);
    if (res.ok) {
      router.push(backHref);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMsg({ ok: false, text: body.error || "Delete failed." });
    }
  }

  const heading = isNew
    ? `New ${def.label.replace(/s$/, "")}`
    : String(item?.[def.itemTitleKey] || "").trim() || "(untitled)";

  return (
    <AdminShell title={heading}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> {def.label}
      </Link>

      {item === null ? (
        list === null ? (
          <div className="mt-6 flex items-center gap-2 text-ink-soft text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-soft">
            This item could not be found. It may have been deleted.{" "}
            <Link href={backHref} className="text-accent underline">
              Go back
            </Link>
          </p>
        )
      ) : (
        <>
          <h1 className="mt-4 font-serif text-2xl sm:text-3xl">{heading}</h1>

          <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
            <ItemForm
              fields={def.fields}
              item={item}
              optionsBySection={optionsBySection}
              onChange={(next) => {
                setItem(next);
                setDirty(true);
                setMsg(null);
              }}
            />
          </div>

          <div className="sticky bottom-4 mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(33,31,26,0.10)]">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : isNew ? "Create" : "Save changes"}
            </button>
            {!isNew && (
              <button
                onClick={remove}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            {dirty && !saving && (
              <span className="text-xs text-ink-soft">Unsaved changes</span>
            )}
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
        </>
      )}
    </AdminShell>
  );
}
