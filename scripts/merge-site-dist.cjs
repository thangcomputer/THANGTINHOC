const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "site_dist");
const clientDist = path.join(root, "client", "dist");
const adminDist = path.join(root, "admin", "dist");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(clientDist)) {
  die("[merge-site-dist] Missing client/dist. Run: npm run build --prefix client");
}
if (!fs.existsSync(adminDist)) {
  die("[merge-site-dist] Missing admin/dist. Run: npm run build --prefix admin");
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "admin"), { recursive: true });

fs.cpSync(clientDist, outDir, { recursive: true });
fs.cpSync(adminDist, path.join(outDir, "admin"), { recursive: true });

console.log("[merge-site-dist] OK ->", outDir);
