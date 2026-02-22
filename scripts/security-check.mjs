import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const trackedFiles = execSync("git ls-files", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const untrackedFiles = execSync("git ls-files --others --exclude-standard", {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);
const targetFiles = [...new Set([...trackedFiles, ...untrackedFiles])];

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".pdf",
  ".zip",
  ".gz",
  ".mp4",
  ".mov",
]);

const forbiddenPathPatterns = [
  /^\.env(?:\..+)?$/i,
  /(?:^|\/)\.env(?:\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.jks$/i,
  /\.keystore$/i,
  /id_rsa$/i,
  /id_ed25519$/i,
  /(?:^|\/)\.npmrc$/i,
];

const secretPatterns = [
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "GitHub token", regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  {
    name: "Private key block",
    regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----/g,
  },
  {
    name: "Generic secret assignment",
    regex: /\b(?:api[-_]?key|token|secret|password|passwd)\s*[:=]\s*["'][^"']+["']/gi,
  },
];

const findings = [];

for (const file of targetFiles) {
  const normalized = file.replace(/\\/g, "/");
  const isEnvExample = /(?:^|\/)\.env\.example$/i.test(normalized);
  if (
    !isEnvExample &&
    forbiddenPathPatterns.some((pattern) => pattern.test(normalized))
  ) {
    findings.push({ file, type: "Forbidden file path", detail: normalized });
    continue;
  }

  const ext = path.extname(normalized).toLowerCase();
  if (binaryExtensions.has(ext)) continue;

  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const { name, regex } of secretPatterns) {
    regex.lastIndex = 0;
    const match = regex.exec(content);
    if (!match) continue;

    findings.push({
      file,
      type: name,
      detail: match[0].slice(0, 80),
    });
  }
}

if (findings.length > 0) {
  console.error("Security check failed. Potential sensitive content found:\n");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.type} (${finding.detail})`);
  }
  process.exit(1);
}

console.log(
  "Security check passed: no obvious secrets found in tracked/untracked files.",
);
