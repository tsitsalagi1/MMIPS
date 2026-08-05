import { execFileSync } from "node:child_process";
const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const patterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"][^'\"]+/i,
  /RESEND_API_KEY\s*=\s*['\"][^'\"]+/i,
  /TURNSTILE_SECRET_KEY\s*=\s*['\"][^'\"]+/i,
  /ghp_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
let failed = false;
for (const file of files) {
  if (/\.(png|jpg|jpeg|gif|ico|svg)$/.test(file)) continue;
  const text = execFileSync("git", ["show", `:${file}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  for (const pattern of patterns) if (pattern.test(text)) { console.error(`Potential committed secret pattern in ${file}`); failed = true; }
}
if (failed) process.exit(1);
console.log("No high-confidence committed secret patterns found in tracked text files.");
