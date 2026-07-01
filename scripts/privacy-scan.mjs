import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const FORBIDDEN_TEXT = [
  { label: "mailmap file/reference", re: new RegExp(`\\.${"mail"}${"map"}\\b`, "i") },
  { label: "placeholder email text", re: new RegExp(`${"tu"}-${"correo"}`, "i") },
  { label: "Vercel deployment URL", re: new RegExp(`${"vercel"}\\.${"app"}`, "i") },
  { label: "private Vercel account slug", re: new RegExp(`${"christopher"}${"bacaa"}`, "i") },
];
const NOREPLY_RE = /^[^@\s]+@users\.noreply\.github\.com$/i;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lines(output) {
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

const failures = [];

for (const file of lines(git(["ls-files"]))) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const emails = [...content.matchAll(EMAIL_RE)];
  for (let index = 0; index < emails.length; index += 1) {
    failures.push(`${file}: contains email-like text`);
  }

  for (const pattern of FORBIDDEN_TEXT) {
    if (pattern.re.test(file) || pattern.re.test(content)) {
      failures.push(`${file}: contains ${pattern.label}`);
    }
  }
}

const identities = new Set(
  lines(git(["log", "--all", "--format=%ae%n%ce"])).map((identity) =>
    identity.trim(),
  ),
);

for (const identity of identities) {
  if (!NOREPLY_RE.test(identity)) {
    failures.push("git metadata: contains a non-noreply identity");
  }
}

if (failures.length > 0) {
  console.error("Privacy scan failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Privacy scan passed: ${lines(git(["ls-files"])).length} tracked files and ${identities.size} git identity value(s) checked.`,
);
