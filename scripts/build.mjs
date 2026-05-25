import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "dist");
const rootFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "robots.txt",
  "sitemap.xml",
];

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });

  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const from = join(source, entry.name);
    const to = join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(from, to);
    } else {
      await copyFile(from, to);
    }
  }
}

await rm(outDir, { force: true, recursive: true });
await mkdir(join(outDir, "contact"), { recursive: true });

for (const file of rootFiles) {
  await copyFile(join(root, file), join(outDir, file));
}

await copyFile(join(root, "contact", "index.html"), join(outDir, "contact", "index.html"));
await copyDirectory(join(root, "assets"), join(outDir, "assets"));

console.log("Static build complete: dist/");
console.log("Public routes: / and /contact");
console.log("Upload the contents of dist/ to your GO54 public_html directory.");
