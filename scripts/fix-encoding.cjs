const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const targets = [
  "admin/src/lib/deviceId.js","admin/src/lib/useIdleLogout.js","admin/src/lib/useSecurityProtection.js","admin/src/lib/logout.js",
  "client/src/lib/deviceId.js","client/src/lib/useIdleLogout.js","client/src/lib/useSecurityProtection.js","client/src/lib/logout.js",
  "server/lib/session.js","server/lib/authSession.js","scripts/merge-site-dist.cjs","package.json"
];
function readText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le");
  if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0) return buf.toString("utf16le");
  return buf.toString("utf8").replace(/^\uFEFF/, "");
}
let n = 0;
for (const rel of targets) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  if (buf.length >= 4 && buf[0] === 0x63 && buf[1] === 0 && buf[2] === 0x6f && buf[3] === 0) {
    fs.writeFileSync(p, readText(buf), "utf8");
    console.log("Fixed:", rel);
    n++;
  }
}
console.log(n ? "Done " + n + " files" : "No UTF-16 found");