import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSection } from "@/lib/adminConfig";

const CONTENT_DIR = path.join(process.cwd(), "content");

function filePathFor(section: string) {
  return path.join(CONTENT_DIR, `${section}.json`);
}

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") ?? "";
  if (!getSection(section)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
  try {
    const raw = await fs.readFile(filePathFor(section), "utf8");
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ error: "Could not read content" }, { status: 500 });
  }
}

async function commitToGitHub(section: string, json: string) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!repo || !token) {
    throw new Error(
      "Saving in production needs the GITHUB_TOKEN and GITHUB_REPO environment variables (set them in Vercel project settings)."
    );
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/content/${section}.json`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const current = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  let sha: string | undefined;
  if (current.ok) {
    sha = (await current.json()).sha;
  } else if (current.status !== 404) {
    throw new Error(`GitHub read failed (${current.status})`);
  }

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `content: update ${section} via admin panel`,
      content: Buffer.from(json, "utf8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub save failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const section: string = body?.section ?? "";
  const def = getSection(section);
  if (!def || body?.data === undefined) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (def.singleton ? Array.isArray(body.data) : !Array.isArray(body.data)) {
    return NextResponse.json({ error: "Wrong data shape" }, { status: 400 });
  }

  const json = JSON.stringify(body.data, null, 2) + "\n";

  try {
    if (process.env.NODE_ENV !== "production") {
      await fs.writeFile(filePathFor(section), json, "utf8");
      return NextResponse.json({ ok: true, mode: "local" });
    }
    await commitToGitHub(section, json);
    return NextResponse.json({ ok: true, mode: "github" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
