const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    try {
      const upstream = await fetch(new URL(url.pathname + url.search, backend), { method: req.method, headers: { accept: req.headers.accept || 'application/json' } });
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json' });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: `Backend unavailable at ${backend}` }));
    }
    return;
  }

  let file;
  if (url.pathname === '/' || url.pathname === '/index.html') file = path.join(root, 'templates', 'index.html');
  else if (url.pathname.startsWith('/static/')) file = path.join(root, url.pathname.slice(1));
  else { res.writeHead(404); res.end('Not found'); return; }

  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, 'utf8', (error, content) => {
    if (error) { res.writeHead(404); res.end('File not found'); return; }
    if (file.endsWith('.html')) {
      content = content.replaceAll("{{ url_for('static', filename='css/style.css') }}", '/static/css/style.css')
        .replaceAll("{{ url_for('static', filename='js/script.js') }}", '/static/js/script.js');
    }
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(port, '127.0.0.1', () => console.log(`LandShield frontend: http://127.0.0.1:${port} (API proxy: ${backend})`));
