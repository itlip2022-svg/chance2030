// Lokaler Dev-Server ohne Abhängigkeiten (Produktion läuft auf Vercel: public/ + api/).
const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleSubscribe } = require("./lib/subscribe");

const PORT = process.env.PORT || 4300;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/subscribe" && req.method === "POST") {
    const payload = await readBody(req);
    const { status, body } = await handleSubscribe(payload);
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
    return;
  }

  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  if (url.pathname === "/" || !path.extname(filePath)) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Nicht gefunden");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Funnel läuft auf http://localhost:${PORT}`);
});
