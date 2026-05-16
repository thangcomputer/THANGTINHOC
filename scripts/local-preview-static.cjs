const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'site_dist');
const ADMIN = path.join(ROOT, 'admin');
const PORT = Number(process.argv[2] || process.env.PREVIEW_PORT || 4288);
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:5000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
};

function underDir(file, dir) {
  const d = path.normalize(dir + path.sep);
  const f = path.normalize(file);
  return f === dir || f.startsWith(d);
}

function safeFileUnder(baseDir, relPieces) {
  const target = path.normalize(path.join(baseDir, ...relPieces));
  return underDir(target, baseDir) ? target : null;
}

function cleanParts(rel) {
  return rel.split('/').filter(Boolean).filter((s) => s !== '..' && s !== '.' && !s.includes('\0'));
}

function resolvePath(urlPath) {
  const pathname = decodeURIComponent((urlPath.split('?')[0] || '/').replace(/\\/g, ''));
  const p = pathname.startsWith('/') ? pathname : '/' + pathname;

  if (p === '/admin' || p === '/admin/') {
    const idx = path.join(ADMIN, 'index.html');
    return fs.existsSync(idx) ? idx : null;
  }
  if (p.startsWith('/admin/')) {
    const inner = p.slice('/admin/'.length);
    const cand = safeFileUnder(ADMIN, cleanParts(inner));
    if (!cand) return path.join(ADMIN, 'index.html');
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
    const asDirIdx = safeFileUnder(ADMIN, cleanParts(inner.replace(/\/$/, '')).concat(['index.html']));
    if (asDirIdx && fs.existsSync(asDirIdx) && fs.statSync(asDirIdx).isFile()) return asDirIdx;
    return path.join(ADMIN, 'index.html');
  }

  if (p === '/' || p === '') return path.join(ROOT, 'index.html');

  const rel = p.replace(/^\//, '');
  const clientCand = safeFileUnder(ROOT, cleanParts(rel));
  if (clientCand && fs.existsSync(clientCand) && fs.statSync(clientCand).isFile()) return clientCand;

  const dirIdxCand = safeFileUnder(ROOT, cleanParts(rel.replace(/\/$/, '')).concat(['index.html']));
  if (dirIdxCand && fs.existsSync(dirIdxCand) && fs.statSync(dirIdxCand).isFile()) return dirIdxCand;

  return path.join(ROOT, 'index.html');
}

function proxyToApi(req, res) {
  const url = new URL(req.url, API_TARGET);
  const lib = url.protocol === 'https:' ? https : http;
  const chunks = [];

  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = { ...req.headers, host: url.host };
    delete headers.connection;

    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: req.method,
      headers,
    };

    const proxyReq = lib.request(opts, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'API khong chay. Terminal: cd server && npm run dev',
        })
      );
    });

    if (body.length) proxyReq.write(body);
    proxyReq.end();
  });
}

function serveStatic(req, res) {
  const file = resolvePath(req.url || '/');
  if (!file || !underDir(path.normalize(file), ROOT)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const u = req.url || '/';

  if (u.startsWith('/api') || u.startsWith('/uploads')) {
    return proxyToApi(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    '\n[preview] http://127.0.0.1:' + PORT + '/\n' +
    '         http://127.0.0.1:' + PORT + '/admin/login\n' +
    'API proxy -> ' + API_TARGET + ' (cd server && npm run dev)\n(ctrl+c)\n'
  );
});
