import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cf";

// Media library backed by Cloudflare R2. Objects live under the `uploads/`
// prefix; the public-facing name is the part after that prefix.

const PREFIX = "uploads/";
const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export async function GET() {
  try {
    const env = await getEnv();
    const files: { name: string; url: string; size: number }[] = [];
    let cursor: string | undefined;

    // R2 list is paginated (1000 per page); follow the cursor to the end.
    do {
      const listing = await env.MEDIA.list({ prefix: PREFIX, cursor });
      for (const obj of listing.objects) {
        const name = obj.key.slice(PREFIX.length);
        if (!name || name.startsWith(".")) continue;
        files.push({ name, url: `/uploads/${name}`, size: obj.size });
      }
      cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);

    files.sort((a, b) => (a.name < b.name ? 1 : -1));
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
    const env = await getEnv();
    await env.MEDIA.delete(`${PREFIX}${name}`);
    return NextResponse.json({ ok: true, mode: "r2" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
