import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const entries = [
  "assets",
  "CNAME",
  "firma-director-imfra.png",
  "firma-ipci.png",
  "logo-imfra.png",
  "manifest.json",
  "onboarding-tour.css",
  "onboarding-tour.js",
  "sw.js"
];

await mkdir(output, { recursive: true });
await Promise.all(entries.map((entry) => cp(resolve(root, entry), resolve(output, entry), {
  recursive: true,
  force: true
})));

console.log(`Copied ${entries.length} static entries to dist.`);
