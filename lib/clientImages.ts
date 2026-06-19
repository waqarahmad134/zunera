// Client-side helpers for staging image uploads until the editor is saved.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function imageSizeError(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image is too large (max 4 MB). Please resize it first.";
  }
  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const ext = (mime.split("/")[1] || "png").replace("+xml", "");
  return new File([arr], `image.${ext}`, { type: mime });
}

// Finds every staged (data:) image inside the data, uploads each once, and
// returns the data with those URLs swapped for the committed /uploads/ paths.
// Returns the same reference untouched when there is nothing to upload.
export async function resolveStagedImages<T>(data: T): Promise<T> {
  let json = JSON.stringify(data);
  const re = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
  const staged = Array.from(new Set(json.match(re) || []));
  if (staged.length === 0) return data;

  for (const dataUrl of staged) {
    const form = new FormData();
    form.append("file", dataUrlToFile(dataUrl));
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      throw new Error(body.error || "Image upload failed.");
    }
    json = json.split(dataUrl).join(body.url);
  }
  return JSON.parse(json) as T;
}

export function countStagedImages<T>(data: T): number {
  const re = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
  return new Set(JSON.stringify(data).match(re) || []).size;
}
