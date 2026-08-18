const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'out');
const PORT = process.env.PORT || 3100;

const DYNAMIC_DIRS = ['tracking', 'kitchen', 'delivery'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.map': 'application/json',
};

function serve(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) return serve404(res);
    res.writeHead(status, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': data.length,
    });
    res.end(data);
  });
}

function serve404(res) {
  fs.readFile(path.join(OUT, '404.html'), (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

function resolveStatic(p) {
  if (p === '/') {
    const index = path.join(OUT, 'index.html');
    return fs.existsSync(index) ? index : null;
  }
  const base = path.join(OUT, p);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    const dirIndex = path.join(base, 'index.html');
    if (fs.existsSync(dirIndex)) return dirIndex;
  }
  const html = `${base}.html`;
  if (fs.existsSync(html)) return html;
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/\/+$/, '');

  const direct = resolveStatic(p);
  if (direct) return serve(res, direct);

  const segments = p.split('/');
  if (segments.length === 2 && DYNAMIC_DIRS.includes(segments[0])) {
    return serve(res, path.join(OUT, segments[0], '__dynamic__.html'));
  }

  if (segments.length === 1 && segments[0]) {
    const slug = path.join(OUT, '__dynamic__.html');
    return serve(res, slug);
  }

  serve404(res);
});

server.listen(PORT, () => {
  console.log(`Static export served at http://localhost:${PORT} (from ${OUT})`);
});