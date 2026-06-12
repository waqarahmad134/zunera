"use client";

import { useEffect, useState } from "react";
import {
  Check, Copy, ImagePlus, Loader2, Trash2, TriangleAlert,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type MediaFile = { name: string; url: string; size: number };

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const [deleting, setDeleting] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/admin/media");
    const body = await res.json().catch(() => ({}));
    if (res.ok) setFiles(body.files);
    else setError(body.error || "Could not load media.");
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) load();
    else setError(body.error || "Upload failed.");
  }

  async function remove(name: string) {
    if (
      !confirm(
        `Delete “${name}”?\n\nIf this image is still used on a page or post, it will stop showing there. This cannot be undone from the admin.`
      )
    )
      return;
    setDeleting(name);
    setError("");
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    setDeleting("");
    if (res.ok) setFiles((f) => f?.filter((x) => x.name !== name) ?? null);
    else setError(body.error || "Delete failed.");
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <AdminShell title="Media">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Media</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            All images uploaded through the admin. Deleting an image that a page
            still uses will break it there.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl bg-accent text-paper px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors cursor-pointer">
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImagePlus size={15} />
          )}
          {uploading ? "Uploading..." : "Upload image"}
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
      </div>

      {error && (
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-red-600">
          <TriangleAlert size={15} /> {error}
        </p>
      )}

      {files === null ? (
        <div className="mt-10 flex items-center gap-2 text-ink-soft text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : files.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-ink-soft">
          No uploads yet. Images added here or through any image field will
          appear in this library.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((f) => (
            <div
              key={f.name}
              className="group rounded-2xl border border-line bg-white/70 overflow-hidden"
            >
              <div className="aspect-square bg-paper-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium" title={f.name}>
                  {f.name}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  {formatSize(f.size)}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => copyUrl(f.url)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[11px] text-ink-soft hover:border-accent hover:text-accent transition-colors"
                  >
                    {copied === f.url ? <Check size={12} /> : <Copy size={12} />}
                    {copied === f.url ? "Copied" : "Copy URL"}
                  </button>
                  <button
                    onClick={() => remove(f.name)}
                    disabled={deleting === f.name}
                    title="Delete"
                    className="rounded-lg border border-line p-1.5 text-ink-soft hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    {deleting === f.name ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
