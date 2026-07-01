"use client";

import { useState } from "react";
import { ImagePlus, Wand2, X } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Field } from "@/lib/adminConfig";
import {
  ACCEPTED_IMAGE_TYPES,
  fileToDataUrl,
  imageSizeError,
} from "@/lib/clientImages";

export type Item = Record<string, unknown>;
export type Option = { value: string; label: string };

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function emptyItem(fields: Field[]): Item {
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

export default function ItemForm({
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
