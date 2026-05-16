const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'site_dist');
const clientDist = path.join(root, 'client', 'dist');
const adminDist = path.join(root, 'admin', 'dist');

const PANEL_KEEP_FILES = new Set(['.user.ini']);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function copyHtaccess(srcRel, destRel) {
  const src = path.join(root, 'deploy', 'apache', srcRel);
  const dest = path.join(outDir, destRel);
  if (!fs.existsSync(src)) die('[merge-site-dist] Missing ' + src);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function clearSiteDist() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    return;
  }
  for (const name of fs.readdirSync(outDir)) {
    if (PANEL_KEEP_FILES.has(name)) continue;
    const p = path.join(outDir, name);
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch (err) {
      console.warn('[merge-site-dist] Skip remove:', p, err.message);
    }
  }
}

if (!fs.existsSync(clientDist)) {
  die('[merge-site-dist] Missing client/dist. Run: npm run build --prefix client');
}
if (!fs.existsSync(adminDist)) {
  die('[merge-site-dist] Missing admin/dist. Run: npm run build --prefix admin');
}

clearSiteDist();
fs.cpSync(clientDist, outDir, { recursive: true });
fs.cpSync(adminDist, path.join(outDir, 'admin'), { recursive: true });

copyHtaccess('site_dist.htaccess', '.htaccess');
copyHtaccess('admin.htaccess', 'admin/.htaccess');

const adminIndex = path.join(outDir, 'admin', 'index.html');
const loginDir = path.join(outDir, 'admin', 'login');
fs.mkdirSync(loginDir, { recursive: true });
fs.copyFileSync(adminIndex, path.join(loginDir, 'index.html'));

console.log('[merge-site-dist] OK ->', outDir);
console.log('[merge-site-dist] .htaccess + admin/.htaccess + admin/login/index.html');