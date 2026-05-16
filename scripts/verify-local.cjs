const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const withBuild = process.argv.includes("--build");
let failed = 0;

function fail(msg) { console.error("FAIL:", msg); failed += 1; }
function ok(msg) { console.log("OK:", msg); }

function looksUtf16(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return true;
  if (buf.length >= 4 && buf[0] === 0x63 && buf[1] === 0 && buf[2] === 0x6f && buf[3] === 0) return true;
  return false;
}

function checkEncoding(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) { fail("Missing: " + rel); return; }
  if (looksUtf16(fs.readFileSync(p))) { fail(rel + " is UTF-16. Run: npm run fix:encoding"); return; }
  ok("UTF-8: " + rel);
}

const encodingFiles = [
  "admin/src/lib/deviceId.js",
  "admin/src/lib/useIdleLogout.js",
  "admin/src/lib/useSecurityProtection.js",
  "client/src/lib/deviceId.js",
  "server/lib/session.js",
  "server/lib/authSession.js",
  "scripts/merge-site-dist.cjs",
];

console.log("\n=== 1. Encoding UTF-8 ===");
encodingFiles.forEach(checkEncoding);

console.log("\n=== 2. Server modules ===");
try {
  require(path.join(root, "server", "lib", "session"));
  require(path.join(root, "server", "lib", "authSession"));
  ok("Server modules load");
} catch (e) {
  fail("Server modules: " + e.message);
}

function testLoginApi() {
  return new Promise((resolve) => {
    const deviceId = "local-verify-device-0001";
    const body = JSON.stringify({
      email: "admin@thangtinhoc.vn",
      password: "admin123",
      deviceId,
    });
    const req = http.request({
      hostname: "127.0.0.1",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 8000,
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        if (res.statusCode === 200) {
          const j = JSON.parse(data);
          if (j.data && j.data.token) ok("POST /api/auth/login");
          else fail("Login missing token");
        } else {
          fail("Login HTTP " + res.statusCode + ": " + data.slice(0, 200));
        }
        resolve();
      });
    });
    req.on("error", () => {
      fail("API not on :5000. Run: cd server && npm run dev");
      resolve();
    });
    req.on("timeout", () => { req.destroy(); fail("Login timeout"); resolve(); });
    req.write(body);
    req.end();
  });
}

console.log("\n=== 3. Login API (server :5000) ===");
testLoginApi().then(() => {
  if (withBuild) {
    console.log("\n=== 4. Build ===");
    if (spawnSync("npm", ["run", "build", "--prefix", "client"], { cwd: root, stdio: "inherit", shell: true }).status !== 0) fail("client build");
    else ok("client build");
    if (spawnSync("npm", ["run", "build", "--prefix", "admin"], { cwd: root, stdio: "inherit", shell: true }).status !== 0) fail("admin build");
    else ok("admin build");
    if (spawnSync("node", ["scripts/merge-site-dist.cjs"], { cwd: root, stdio: "inherit" }).status !== 0) fail("merge");
    else ok("merge site_dist");
    if (!fs.existsSync(path.join(root, "site_dist", ".htaccess"))) fail("missing site_dist/.htaccess");
    else ok("site_dist/.htaccess");
  }
  console.log("\n=== Result ===");
  if (failed) { console.error(failed + " error(s) - do NOT push"); process.exit(1); }
  console.log("All OK - safe to push");
  console.log("Dev: server :5000 | admin :5174/login | client :5173");
});