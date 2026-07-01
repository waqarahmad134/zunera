"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Drawer from "@/components/admin/Drawer";
import ItemForm, { type Item, type Option } from "@/components/admin/ItemForm";
import { getSection } from "@/lib/adminConfig";
import { fetchOptionsBySection } from "@/lib/adminOptions";
import { countStagedImages, resolveStagedImages } from "@/lib/clientImages";

export default function SectionEditorPage() {
  const { section } = useParams<{ section: string }>();
  const router = useRouter();
  const def = getSection(section);

  const [data, setData] = useState<Item[] | Item | null>(null);
  const [optionsBySection, setOptionsBySection] = useState<Record<string, Option[]>>({});
  const [drawerIdx, setDrawerIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!def) return;
    const res = await fetch(`/api/admin/content?section=${def.slug}`);
    if (res.ok) setData((await res.json()).data);
    setOptionsBySection(await fetchOptionsBySection(def));
  }, [def]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(
    () => (Array.isArray(data) ? data : null),
    [data]
  );

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

  function update(next: Item[] | Item) {
    setData(next);
    setDirty(true);
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      // Upload any images that were staged as local previews, then save the
      // content with their committed URLs in a single step.
      const pending = countStagedImages(data);
      if (pending > 0) {
        setMsg({
          ok: true,
          text: `Uploading ${pending} image${pending > 1 ? "s" : ""}...`,
        });
      }
      const resolved = await resolveStagedImages(data);
      if (resolved !== data) setData(resolved);

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: def!.slug, data: resolved }),
      });
      const body = await res.json().catch(() => ({}));
      setSaving(false);
      if (res.ok) {
        setDirty(false);
        setMsg({
          ok: true,
          text: "Saved. Changes are live on the website immediately.",
        });
      } else {
        setMsg({ ok: false, text: body.error || "Save failed." });
      }
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  const saveBar = (
    <div className="sticky bottom-4 mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(33,31,26,0.10)]">
      <button
        onClick={save}
        disabled={saving || !dirty}
        className="inline-flex items-center gap-2 rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Saving..." : "Save changes"}
      </button>
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
  );

  if (data === null) {
    return (
      <AdminShell title={def.label}>
        <div className="flex items-center gap-2 text-ink-soft text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      </AdminShell>
    );
  }

  // Singleton: one form.
  if (def.singleton) {
    return (
      <AdminShell title={def.label}>
        <h1 className="font-serif text-3xl">{def.label}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{def.description}</p>
        <div className="mt-7 rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
          <ItemForm
            fields={def.fields}
            item={data as Item}
            optionsBySection={optionsBySection}
            onChange={(item) => update(item)}
          />
        </div>
        {saveBar}
      </AdminShell>
    );
  }

  // List editor: table + a side drawer for the open item.
  const list = items!;
  const drawerItem = drawerIdx !== null ? list[drawerIdx] : null;
  const drawerTitle =
    drawerItem && String(drawerItem[def.itemTitleKey] || "").trim();

  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
    setDrawerIdx(null);
  }

  function deleteItem(i: number) {
    const title = String(list[i][def!.itemTitleKey] || "").trim() || "(untitled)";
    if (!confirm(`Delete “${title}”? This cannot be undone after saving.`)) return;
    update(list.filter((_, j) => j !== i));
    setDrawerIdx(null);
  }

  return (
    <AdminShell title={def.label}>
      <DataTable
        def={def}
        items={list}
        optionsBySection={optionsBySection}
        onRowClick={(i) => setDrawerIdx(i)}
        onAddNew={() => router.push(`/admin/${def.slug}/new`)}
        onMove={moveItem}
        onDelete={deleteItem}
      />
      {saveBar}

      <Drawer
        open={drawerIdx !== null}
        onClose={() => setDrawerIdx(null)}
        title={drawerTitle || "(untitled)"}
        subtitle={def.label}
        footer={
          <>
            <button
              onClick={() => drawerIdx !== null && deleteItem(drawerIdx)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              onClick={() => setDrawerIdx(null)}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Done
            </button>
          </>
        }
      >
        {drawerItem && (
          <ItemForm
            fields={def.fields}
            item={drawerItem}
            optionsBySection={optionsBySection}
            onChange={(nextItem) =>
              update(list.map((it, j) => (j === drawerIdx ? nextItem : it)))
            }
          />
        )}
      </Drawer>
    </AdminShell>
  );
}
