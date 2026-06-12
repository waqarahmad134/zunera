import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

function ghConfig() {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!repo || !token) {
    throw new Error(
      "Media management in production needs the GITHUB_TOKEN and GITHUB_REPO environment variables."
    );
  }
  return { repo, token, branch };
}

export async function GET() {
  try {
    if (process.env.NODE_ENV !== "production") {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      const names = await fs.readdir(UPLOADS_DIR);
      const files = await Promise.all(
        names
          .filter((n) => !n.startsWith("."))
          .map(async (name) => {
            const stat = await fs.stat(path.join(UPLOADS_DIR, name));
            return { name, url: `/uploads/${name}`, size: stat.size };
          })
      );
      return NextResponse.json({ files: files.sort((a, b) => (a.name < b.name ? 1 : -1)) });
    }

    const { repo, token, branch } = ghConfig();
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/public/uploads?ref=${branch}`,
      { headers: ghHeaders(token) }
    );
    if (res.status === 404) return NextResponse.json({ files: [] });
    if (!res.ok) throw new Error(`GitHub list failed (${res.status})`);
    const items = (await res.json()) as { name: string; size: number; type: string }[];
    const files = items
      .filter((i) => i.type === "file" && !i.name.startsWith("."))
      .map((i) => ({ name: i.name, url: `/uploads/${i.name}`, size: i.size }))
      .sort((a, b) => (a.name < b.name ? 1 : -1));
    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not list media" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { name } = await req.json().catch(() => ({ name: "" }));
  if (typeof name !== "string" || !NAME_RE.test(name)) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      await fs.unlink(path.join(UPLOADS_DIR, name));
      return NextResponse.json({ ok: true, mode: "local" });
    }

    const { repo, token, branch } = ghConfig();
    const apiUrl = `https://api.github.com/repos/${repo}/contents/public/uploads/${name}`;
    const current = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: ghHeaders(token),
    });
    if (!current.ok) throw new Error(`File not found on GitHub (${current.status})`);
    const { sha } = await current.json();

    const res = await fetch(apiUrl, {
      method: "DELETE",
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: `content: delete ${name} via admin panel`,
        sha,
        branch,
      }),
    });
    if (!res.ok) throw new Error(`GitHub delete failed (${res.status})`);
    return NextResponse.json({ ok: true, mode: "github" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
