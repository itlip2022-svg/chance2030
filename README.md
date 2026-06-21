# CHANCE2030 — Landingpage

Single-page Landingpage für das Projekt **Chance2030 — Baustelle eines möglichen Ortes**.
Gebaut mit Node.js / Express, vorbereitet für ein Deployment auf **Vercel**.

## Features

- **Eine Landingpage** (`/`) nach der Designvorlage (Archivo/Spectral, editoriales Schwarz-auf-Weiß).
- **Interaktiver Hintergrund** — das THREE.js-Partikelnetz von [postyour.art](https://postyour.art)
  wurde übernommen und auf den hellen Hintergrund angepasst. Die Partikel driften
  sanft und werden vom Mauszeiger angezogen. (`public/assets/background.js`)
- **Dummy-Bilder statt der grauen Flächen** — jede Platzhalterfläche zeigt ein
  Dummy-Bild. Bei **Mouseover** wird es hervorgehoben (Zoom, Farbe, Overlay),
  beim **Klick** öffnet sich eine **Lightbox mit der ganzen Collection** zum
  jeweiligen Thema (Blättern per Pfeil/Tastatur, Thumbnail-Leiste).
- **Impressum & Datenschutz** als einfache Unterseite (`/impressum`), aus dem
  Footer verlinkt.

## Lokal starten

```bash
npm install
npm start
# → http://localhost:3000
```

## Deployment auf Vercel

Das Projekt ist deploybar wie es ist:

1. Repository zu Vercel importieren (oder `npx vercel`).
2. Vercel erkennt `vercel.json` und führt `server.js` als Node-Funktion aus.

Es sind keine Umgebungsvariablen nötig.

## Struktur

```
server.js            Express-Server (lokal + Vercel-Handler)
vercel.json          Vercel-Konfiguration (@vercel/node)
public/
  index.html         Landingpage
  impressum.html     Impressum & Datenschutz
  assets/
    styles.css       Styles
    app.js           Scroll-Reveal, Collections, Lightbox
    background.js    Partikelnetz-Hintergrund (THREE.js via CDN)
```

## Echte Bilder einsetzen

Die Dummy-Bilder kommen von `picsum.photos` (Graustufen). In
`public/assets/app.js` das Objekt `COLLECTIONS` anpassen: pro Thema die
`images`-Arrays mit den echten Bild-URLs füllen — Slot-Thumbnails und Lightbox
übernehmen die neuen Bilder automatisch.
