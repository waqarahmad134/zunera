// Uploads everything in public/uploads/ into the R2 `MEDIA` bucket so that
// images committed before the Cloudflare migration appear in the admin media
// library and are served from R2.
//
//   node scripts/upload-media.mjs --local    # into the local R2 simulator
//   node scripts/upload-media.mjs --remote   # into the real bucket
//
// (the npm scripts media:upload:local / media:upload wrap these.)
import { readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const remote = process.argv.includes("--remote");
const scope = remote ? "--remote" : "--local";
const BUCKET = "zunera-media";

const dir = path.join(root, "public", "uploads");
if (!existsSync(dir)) {
  console.log("No public/uploads directory — nothing to upload.");
  process.exit(0);
}

const files = readdirSync(dir).filter((f) => !f.startsWith("."));
if (files.length === 0) {
  console.log("public/uploads is empty — nothing to upload.");
  process.exit(0);
}

for (const file of files) {
  const key = `${BUCKET}/uploads/${file}`;
  const filePath = path.join(dir, file);
  console.log(`→ ${scope} ${key}`);
  execFileSync(
    "npx",
    ["wrangler", "r2", "object", "put", key, `--file=${filePath}`, scope],
    { stdio: "inherit", cwd: root }
  );
}
console.log(`Uploaded ${files.length} file(s) to ${BUCKET} (${scope}).`);
