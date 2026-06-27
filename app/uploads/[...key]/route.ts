import { getEnv } from "@/lib/cf";

// Serves uploaded images from the R2 `MEDIA` bucket at /uploads/<name>.
// (Files committed under /public/uploads are served as static assets before
// this handler is ever reached, so legacy uploads keep working too.)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = `uploads/${key.join("/")}`;

  const env = await getEnv();
  const object = await env.MEDIA.get(objectKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
}
