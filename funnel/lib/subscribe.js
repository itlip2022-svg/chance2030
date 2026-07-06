// Nimmt eine E-Mail-Anmeldung entgegen und speichert sie.
// Speicher-Backends (in dieser Reihenfolge, je nach gesetzten Env-Variablen):
//   1. BREVO_API_KEY (+ optional BREVO_LIST_ID)  -> Kontakt wird in Brevo angelegt
//   2. SUBSCRIBE_WEBHOOK_URL                     -> JSON-POST an beliebigen Webhook (Zapier/Make/Sheets)
//   3. Fallback: data/subscribers.jsonl          -> lokale Datei (nur für Entwicklung;
//      auf Vercel ist das Dateisystem nicht persistent!)

const fs = require("fs");
const path = require("path");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function saveToBrevo(entry) {
  const body = {
    email: entry.email,
    updateEnabled: true,
    attributes: {
      VORNAME: entry.name || "",
      QUELLE: entry.source || "funnel",
    },
  };
  const listId = parseInt(process.env.BREVO_LIST_ID, 10);
  if (!isNaN(listId)) body.listIds = [listId];

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  // 201 = neu angelegt, 204 = aktualisiert
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Brevo antwortete mit ${res.status}: ${text}`);
  }
}

async function saveToWebhook(entry) {
  const res = await fetch(process.env.SUBSCRIBE_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Webhook antwortete mit ${res.status}`);
}

function saveToFile(entry) {
  const dir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, "subscribers.jsonl"), JSON.stringify(entry) + "\n");
}

/**
 * @param {{email?: string, name?: string, source?: string, website?: string}} payload
 * @returns {Promise<{status: number, body: object}>}
 */
async function handleSubscribe(payload) {
  const { email, name, source, website } = payload || {};

  // Honeypot: echte Nutzer füllen das unsichtbare Feld "website" nie aus.
  if (website) return { status: 200, body: { ok: true } };

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return { status: 400, body: { ok: false, error: "Bitte eine gültige E-Mail-Adresse angeben." } };
  }

  const entry = {
    email: String(email).trim().toLowerCase(),
    name: String(name || "").trim().slice(0, 100),
    source: String(source || "funnel").slice(0, 50),
    ts: new Date().toISOString(),
  };

  try {
    if (process.env.BREVO_API_KEY) {
      await saveToBrevo(entry);
    } else if (process.env.SUBSCRIBE_WEBHOOK_URL) {
      await saveToWebhook(entry);
    } else if (process.env.VERCEL) {
      // Dateisystem auf Vercel ist schreibgeschützt. Eintrag ins Log, damit die
      // Adresse per `vercel logs` rekonstruierbar bleibt — aber unbedingt
      // BREVO_API_KEY oder SUBSCRIBE_WEBHOOK_URL konfigurieren!
      console.error("[subscribe] KEIN persistentes Backend konfiguriert! Eintrag nur im Log:", JSON.stringify(entry));
    } else {
      saveToFile(entry);
    }
    console.log("[subscribe] Neue Anmeldung:", entry.email, "via", entry.source);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error("[subscribe] Fehler:", err.message);
    return {
      status: 500,
      body: { ok: false, error: "Speichern fehlgeschlagen. Bitte später erneut versuchen." },
    };
  }
}

module.exports = { handleSubscribe };
