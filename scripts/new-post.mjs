import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rawTitle = process.argv.slice(2).join(" ").trim();

if (!rawTitle) {
  console.error("Usage: npm run new:post -- \"Post title\"");
  process.exit(1);
}

const slug = rawTitle
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^\w\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

if (!slug) {
  console.error("Could not generate a slug from the title.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const postPath = path.resolve("src/content/blog", `${slug}.md`);
const imageDir = path.resolve("public/blog-images", slug);

const template = `---
title: "${rawTitle.replace(/"/g, '\\"')}"
description: ""
date: ${today}
tags:
  - memo
heroImage: "/blog-images/${slug}/cover.jpg"
---

本文をここに書く

![Image alt text](/blog-images/${slug}/image-01.jpg)
`;

await mkdir(path.dirname(postPath), { recursive: true });
await mkdir(imageDir, { recursive: true });
await writeFile(postPath, template, { flag: "wx", encoding: "utf8" });

console.log(`Created: ${postPath}`);
console.log(`Image dir: ${imageDir}`);
