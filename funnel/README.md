# Worpswede Direktbuchungs-Funnel

Vorgelagerte Landingpage für [ferienwohnung-in-worpswede.de](https://ferienwohnung-in-worpswede.de/), gedacht für eine Subdomain wie **entdecken.ferienwohnung-in-worpswede.de**.

**Zweck:** Besucher aus YouTube, Instagram & Co. „einfangen", in das Angebot hineinziehen und

1. **primär** ihre E-Mail-Adresse einsammeln (Belohnung: 10% Willkommensrabatt + Worpswede-Insider-Guide),
2. **letztlich** zur Direktbuchung auf die Lodgify-Buchungsseite führen.

## Aufbau

- `public/` — statische Landingpage (HTML/CSS/JS, keine Frameworks)
- `api/subscribe.js` — Vercel Serverless Function, speichert E-Mail-Anmeldungen
- `lib/subscribe.js` — gemeinsame Speicherlogik
- `server.js` — lokaler Dev-Server ohne Abhängigkeiten: `npm start` → http://localhost:4300

## E-Mail-Speicherung (wichtig!)

Die Funktion `api/subscribe` wählt das Backend nach Env-Variablen:

| Env-Variable | Verhalten |
|---|---|
| `BREVO_API_KEY` (+ optional `BREVO_LIST_ID`) | Kontakt wird in [Brevo](https://www.brevo.com) angelegt — **empfohlen** (kostenloser Tarif, DSGVO-konform, Double-Opt-in & Willkommens-Mail mit Insider-Guide dort als Automation einrichten) |
| `SUBSCRIBE_WEBHOOK_URL` | JSON-POST an beliebigen Webhook (Zapier/Make → Google Sheet o.ä.) |
| *(nichts gesetzt)* | Lokale Datei `data/subscribers.jsonl` — funktioniert nur in der lokalen Entwicklung. Auf Vercel ist das Dateisystem **nicht persistent**; Einträge erscheinen dann nur in `vercel logs`! |

→ **Vor dem Livegang unbedingt Brevo (oder Webhook) konfigurieren**, z.B. `vercel env add BREVO_API_KEY`.

## Deployment auf die Subdomain (Vercel)

1. Neues Vercel-Projekt anlegen, als **Root Directory** diesen Ordner (`funnel/`) wählen.
2. Env-Variablen setzen (siehe oben).
3. Unter *Settings → Domains* die Subdomain hinzufügen, z.B. `entdecken.ferienwohnung-in-worpswede.de`.
4. Beim DNS-Anbieter der Hauptdomain einen CNAME-Eintrag anlegen: `entdecken` → `cname.vercel-dns.com`.

## Manuelle To-dos für den Betreiber

- **Rabattcode `WILLKOMMEN10`** in Lodgify als Promo-Code anlegen (10%), damit er bei der Buchung wirklich funktioniert. Code ändern: in `public/index.html` (Erfolgsbox) und `public/assets/app.js` (`DISCOUNT_CODE`).
- **Insider-Guide**: kurzes PDF mit Lieblingsorten erstellen und als Willkommens-Mail (z.B. Brevo-Automation) verschicken — die Seite verspricht ihn.
- Die ausgehenden Buchungslinks tragen UTM-Parameter (`utm_source=funnel`), damit Erfolge in Analytics/Lodgify nachvollziehbar sind.

## Exit-Intent-Popup testen

Das Popup erscheint bewusst zurückhaltend: frühestens nach 15 s Verweildauer, nur bei Exit-Absicht (Desktop: Maus verlässt das Fenster nach oben; Mobil: nach 60% Scrolltiefe), maximal einmal pro Woche und nie nach erfolgter Eintragung.

Zum Testen die Seite mit **`?popup=test`** aufrufen (z.B. `http://localhost:4300/?popup=test`) — dann erscheint es sofort und ohne Sperren; die Wochen-Sperre wird dabei nicht gesetzt.
