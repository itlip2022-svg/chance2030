// Vercel Serverless Function: POST /api/subscribe
const { handleSubscribe } = require("../lib/subscribe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  const { status, body } = await handleSubscribe(req.body);
  res.status(status).json(body);
};
