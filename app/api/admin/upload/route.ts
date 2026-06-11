import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 4 * 1024 * 1024; // keep under Vercel's request body limit

function safeName(original: string, ext: string) {
  const base = original
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";
  return `${base}-${Date.now()}.${ext}`;
}

async function commitToGitHub(relPath: string, bytes: Buffer) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!repo || !token) {
    throw new Error(
      "Uploading in production needs the GITHUB_TOKEN and GITHUB_REPO environment variables (set them in Vercel project settings)."
    );
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${relPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `content: upload ${relPath} via admin panel`,
        content: bytes.toString("base64"),
        branch,
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub upload failed (${res.status}): ${body.slice(0, 200)}`);
  }
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
        { error: "Image is too large (max 4 MB). Please resize it first." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = safeName(file.name, ext);
    const relPath = `public/uploads/${name}`;

    if (process.env.NODE_ENV !== "production") {
      const dir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, name), bytes);
      return NextResponse.json({ ok: true, url: `/uploads/${name}`, mode: "local" });
    }

    await commitToGitHub(relPath, bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${name}`, mode: "github" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
