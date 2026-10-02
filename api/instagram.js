// api/instagram.js — Vercel Serverless Function
// Proxies Instagram oEmbed so the access token stays server-side.
//
// Deploy to Vercel, then set the environment variable:
//   INSTAGRAM_TOKEN=your_token_here
//
// Usage from the browser:
//   /api/instagram?url=https://www.instagram.com/p/ABC123/

export default async function handler(req, res) {
  const { url, maxwidth = 540 } = req.query;

  if (!url || !url.startsWith("https://www.instagram.com/p/")) {
    return res.status(400).json({ error: "Missing or invalid Instagram post URL" });
  }

  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "INSTAGRAM_TOKEN environment variable not set" });
  }

  try {
    const api = new URL("https://graph.facebook.com/v21.0/instagram_oembed");
    api.searchParams.set("url", url.split("?")[0]); // strip query params
    api.searchParams.set("maxwidth", maxwidth);
    api.searchParams.set("fields", "html,thumbnail_url,author_name,provider_name");
    api.searchParams.set("access_token", token);

    const upstream = await fetch(api.toString());
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    // Cache successful responses for 1 hour
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
