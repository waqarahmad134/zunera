"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, ImagePlus, Loader2,
  Plus, Save, Trash2, TriangleAlert, Wand2, X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { getSection, type Field } from "@/lib/adminConfig";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok && body.url) onChange(body.url);
    else setError(body.error || "Upload failed.");
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
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="mt-2 text-xs text-ink-soft/80">
            JPG, PNG, WebP, GIF or AVIF. Max 4 MB.
          </p>
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
          {Boolean(value) ? "Visible on the website" : "Hidden (draft)"}
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
  const [openIdx, setOpenIdx] = useState<number | null>(null);
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
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: def!.slug, data }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setMsg({
        ok: true,
        text:
          body.mode === "github"
            ? "Saved. The website rebuilds now and updates in about a minute."
            : "Saved.",
      });
    } else {
      setMsg({ ok: false, text: body.error || "Save failed." });
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

  // List editor.
  const list = items!;
  return (
    <AdminShell title={def.label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">{def.label}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{def.description}</p>
        </div>
        <button
          onClick={() => {
            update([emptyItem(def.fields), ...list]);
            setOpenIdx(0);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-paper px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Add new
        </button>
      </div>

      <div className="mt-7 grid gap-3">
        {list.length === 0 && (
          <p className="text-sm text-ink-soft rounded-2xl border border-dashed border-line p-8 text-center">
            Nothing here yet. Use “Add new” to create the first entry.
          </p>
        )}
        {list.map((item, i) => {
          const open = openIdx === i;
          const title =
            String(item[def.itemTitleKey] || "").trim() || "(untitled)";
          return (
            <div
              key={i}
              className="rounded-2xl border border-line bg-white/70 overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3 sm:p-4">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                >
                  {open ? (
                    <ChevronUp size={16} className="shrink-0 text-accent" />
                  ) : (
                    <ChevronDown size={16} className="shrink-0 text-ink-soft" />
                  )}
                  <span className="truncate text-sm font-medium">{title}</span>
                  {"published" in item && !item.published && (
                    <span className="shrink-0 rounded-full bg-paper-soft border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-soft">
                      Draft
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => {
                      if (i === 0) return;
                      const next = [...list];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      update(next);
                      setOpenIdx(null);
                    }}
                    disabled={i === 0}
                    title="Move up"
                    className="p-2 text-ink-soft hover:text-accent disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (i === list.length - 1) return;
                      const next = [...list];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      update(next);
                      setOpenIdx(null);
                    }}
                    disabled={i === list.length - 1}
                    title="Move down"
                    className="p-2 text-ink-soft hover:text-accent disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete “${title}”? This cannot be undone after saving.`)) return;
                      update(list.filter((_, j) => j !== i));
                      setOpenIdx(null);
                    }}
                    title="Delete"
                    className="p-2 text-ink-soft hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {open && (
                <div className="border-t border-line p-4 sm:p-5 bg-white">
                  <ItemForm
                    fields={def.fields}
                    item={item}
                    optionsBySection={optionsBySection}
                    onChange={(nextItem) =>
                      update(list.map((it, j) => (j === i ? nextItem : it)))
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {saveBar}
    </AdminShell>
  );
}
