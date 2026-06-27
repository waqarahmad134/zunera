import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cf";

// Image uploads are stored in Cloudflare R2 under the `uploads/` prefix and
// served back through the /uploads/[...] route handler. The returned URL stays
// `/uploads/<name>`, so stored content references are origin-relative and
// portable.

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 10 * 1024 * 1024; // R2 has no small request-body limit

function safeName(original: string, ext: string) {
  const base =
    original
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
  return `${base}-${Date.now()}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, GIF or AVIF images are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large (max 10 MB). Please resize it first." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const name = safeName(file.name, ext);
    const key = `uploads/${name}`;

    const env = await getEnv();
    await env.MEDIA.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });

    return NextResponse.json({ ok: true, url: `/uploads/${name}`, mode: "r2" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
