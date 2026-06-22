/**
 * CHANCE2030 — minimal Node/Express server.
 *
 * Serves the static landing page from /public. Works both locally
 * (`npm start` → http://localhost:3000) and as a Vercel serverless
 * function (see vercel.json — the exported app is the request handler).
 */
const path = require('path');
const express = require('express');

const app = express();
const PUBLIC_DIR = path.join(__dirname, 'public');

// Static assets (html, css, js, images).
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (/\.(css|js)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// Clean URL for the legal subpage.
app.get('/impressum', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'impressum.html'));
});

// English landing page.
app.get('/en', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.en.html'));
});

// Landing page.
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Run a local server only when executed directly (not on Vercel).
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`CHANCE2030 läuft auf http://localhost:${port}`);
  });
}

module.exports = app;
