"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Check, ImagePlus, Loader2, Save, Trash2, TriangleAlert, Wand2, X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import RichTextEditor from "@/components/admin/RichTextEditor";
import DataTable from "@/components/admin/DataTable";
import Drawer from "@/components/admin/Drawer";
import { getSection, type Field } from "@/lib/adminConfig";
import {
  ACCEPTED_IMAGE_TYPES,
  countStagedImages,
  fileToDataUrl,
  imageSizeError,
  resolveStagedImages,
} from "@/lib/clientImages";

type Item = Record<string, unknown>;
type Option = { value: string; label: string };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyItem(fields: Field[]): Item {
  const item: Item = {};
  for (const f of fields) {
    if (f.type === "number") item[f.key] = new Date().getFullYear();
    else if (f.type === "checkbox") item[f.key] = false;
    else if (f.type === "tags") item[f.key] = [];
    else item[f.key] = "";
  }
  return item;
}

function ImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [error, setError] = useState("");
  const staged = value.startsWith("data:");

  async function stage(file: File) {
    setError("");
    const sizeError = imageSizeError(file);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    try {
      onChange(await fileToDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the image.");
    }
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="size-24 rounded-xl object-cover border border-line"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              title="Remove image"
              className="absolute -top-2 -right-2 rounded-full bg-ink text-paper p-1 hover:bg-red-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="size-24 shrink-0 rounded-xl border border-dashed border-line grid place-items-center text-ink-soft/50">
            <ImagePlus size={20} />
          </div>
        )}
        <div className="min-w-0">
          <label className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink-soft cursor-pointer hover:border-accent hover:text-accent transition-colors">
            <ImagePlus size={14} />
            {value ? "Replace image" : "Choose image"}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) stage(f);
                e.target.value = "";
              }}
            />
          </label>
          {staged ? (
            <p className="mt-2 text-xs text-accent">
              Ready to upload when you click Save.
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-soft/80">
              JPG, PNG, WebP, GIF or AVIF. Max 4 MB.
            </p>
          )}
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  options,
  onChange,
  onGenerateSlug,
}: {
  field: Field;
  value: unknown;
  options: Option[];
  onChange: (v: unknown) => void;
  onGenerateSlug?: () => void;
}) {
  const base =
    "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";

  if (field.type === "image") {
    return (
      <ImageInput value={String(value ?? "")} onChange={(v) => onChange(v)} />
    );
  }
  if (field.type === "richtext") {
    return (
      <RichTextEditor value={String(value ?? "")} onChange={(v) => onChange(v)} />
    );
  }
  if (field.type === "textarea") {
    const isLong = field.key === "content";
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={isLong ? 12 : 4}
        className={`${base} resize-y leading-relaxed`}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-[#9a4a2a]"
        />
        <span className="text-sm text-ink-soft">
          {field.checkboxLabel
            ? field.checkboxLabel
            : Boolean(value)
              ? "Visible on the website"
              : "Hidden (draft)"}
        </span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "tags") {
    return (
      <input
        type="text"
        value={Array.isArray(value) ? value.join(", ") : ""}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        className={base}
        placeholder="One, Two, Three"
      />
    );
  }
  if (field.type === "slug") {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(slugify(e.target.value))}
          className={base}
          placeholder="my-post-title"
        />
        {onGenerateSlug && (
          <button
            type="button"
            onClick={onGenerateSlug}
            title="Generate from title"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-line px-3 text-xs text-ink-soft hover:border-accent hover:text-accent transition-colors"
          >
            <Wand2 size={13} /> Auto
          </button>
        )}
      </div>
    );
  }
  return (
    <input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) =>
        onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
      }
      className={base}
      placeholder={field.placeholder}
    />
  );
}

function ItemForm({
  fields,
  item,
  optionsBySection,
  onChange,
}: {
  fields: Field[];
  item: Item;
  optionsBySection: Record<string, Option[]>;
  onChange: (item: Item) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const wide =
          f.type === "textarea" ||
          f.key === "title" ||
          f.type === "tags" ||
          f.type === "image" ||
          f.type === "richtext";
        return (
          <div key={f.key} className={wide ? "sm:col-span-2" : undefined}>
            <label className="block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5">
              {f.label}
            </label>
            <FieldInput
              field={f}
              value={item[f.key]}
              options={f.optionsFrom ? optionsBySection[f.optionsFrom] ?? [] : []}
              onChange={(v) => onChange({ ...item, [f.key]: v })}
              onGenerateSlug={
                f.type === "slug" && typeof item.title === "string"
                  ? () => onChange({ ...item, [f.key]: slugify(String(item.title)) })
                  : undefined
              }
            />
            {f.help && <p className="mt-1.5 text-xs text-ink-soft/80">{f.help}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function SectionEditorPage() {
  const { section } = useParams<{ section: string }>();
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
        onAddNew={() => {
          update([emptyItem(def.fields), ...list]);
          setDrawerIdx(0);
        }}
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
