// api/contact.js — Vercel Serverless Function
// Sends contact-form messages by email via Resend (https://resend.com).
//
// Set these environment variables in Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY   (required)  your Resend API key
//   CONTACT_TO       (optional)  where messages go — defaults to hello@flmno.com
//   CONTACT_FROM     (optional)  sender — defaults to Resend's onboarding sender,
//                                which only delivers to your own Resend account email.
//                                Verify flmno.com in Resend to send from e.g. site@flmno.com.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const name    = String(body.name    || "").trim().slice(0, 200);
  const email   = String(body.email   || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 5000);

  // Honeypot — real people never fill this hidden field
  if (body.company) return res.status(200).json({ ok: true });

  if (!message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please add your email and a message." });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: "Email isn't configured yet." });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "flmno site <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || "hello@flmno.com"],
      reply_to: email,
      subject: `New message from ${name || email}`,
      text: `Name: ${name || "—"}\nEmail: ${email}\n\n${message}`,
    }),
  });

  if (!r.ok) return res.status(502).json({ error: "Couldn't send right now." });
  return res.status(200).json({ ok: true });
}
