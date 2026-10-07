#!/usr/bin/env node
/**
 * flmno site builder
 * ------------------
 * Reads content.json and writes one HTML file per project into projects/<slug>/index.html
 *
 * Usage:
 *   node build.js              → rebuild all projects
 *   node build.js galen-tines-zine   → rebuild one project
 */

const fs   = require("fs");
const path = require("path");

const ROOT    = __dirname;
const CONTENT = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8"));

// ── Helpers ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src || "");

// Resize remote /media/ images on request; local /assets/ files pass through untouched
function imgFit(url, h = 900, q = 82, w = Math.round(h * 1.8)) {
  if (!url || !url.startsWith("/media/") || url.includes("/v1/")) return url;
  const m = url.match(/^\/media\/[^/]+~mv2\.[a-z]+/i);
  if (!m) return url;
  const fname = m[0].split("/").pop();
  return `${m[0]}/v1/fit/w_${w},h_${h},q_${q},usm_0.33_1.00_0.20,enc_avif,quality_auto/${fname}`;
}

function imgFill(url, w, h, q = 82) {
  if (!url || !url.startsWith("/media/") || url.includes("/v1/")) return url;
  if (!h) return imgFit(url, w, q, w);
  const fname = url.split("/").pop();
  return `${url}/v1/fill/w_${w},h_${h},al_c,q_${q},usm_0.33_1.00_0.20,enc_avif,quality_auto/${fname}`;
}

// Image or looping video, whichever the source is
function media(src, url, attrs = "") {
  return isVideo(src)
    ? `<video src="${src}" autoplay muted loop playsinline preload="metadata"${attrs}></video>`
    : `<img src="${url}" alt=""${attrs}>`;
}

const ARROW  = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EXPAND = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 1h5v5M6 13H1V8"/></svg>`;
const CLOSE  = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg>`;

// ── Sections ────────────────────────────────────────────────────────────────

function renderCarousel(gallery) {
  if (!gallery?.length) return "";
  const slides = gallery.slice(0, 3).map(src =>
    `      <button class="cs-carousel__item" type="button" data-open="gallery" aria-label="Open gallery">` +
    `${media(src, imgFit(src, 900, 82), ' loading="eager" draggable="false"')}</button>`
  ).join("\n");

  const stills = gallery.filter(s => !isVideo(s));
  const rest   = stills.slice(3).length ? stills.slice(3) : stills;
  const thumbs = [...rest, ...rest, ...rest].slice(0, 3);
  const thumbHtml = thumbs.map(t =>
    `          <span class="cs-explore__thumb"><img src="${imgFill(t, 280, 280, 75)}" alt="" loading="lazy" draggable="false"></span>`
  ).join("\n");

  return `
    <section class="cs-carousel" aria-label="Project images">
${slides}
      <button class="cs-explore" type="button" data-open="gallery">
        <span class="cs-explore__stack" aria-hidden="true">
${thumbHtml}
        </span>
        <span class="cs-explore__label"><span>Explore the gallery</span>${EXPAND}</span>
      </button>
    </section>`;
}

function renderInstagramFeed(posts) {
  if (!posts?.length) return "";
  const postsJson = JSON.stringify(posts, null, 4)
    .split("\n").map(l => "      " + l).join("\n");
  return `
    <div class="cs-feed" id="cs-feed" aria-label="Instagram posts"></div>
    <script>
    (() => {
      const POSTS = ${postsJson.trimStart()};
      const feed  = document.getElementById("cs-feed");
      POSTS.forEach((url, i) => {
        const item = document.createElement("div");
        item.className = "cs-feed__item is-loading";
        feed.appendChild(item);
        setTimeout(() => {
          fetch(\`/api/instagram?url=\${encodeURIComponent(url)}\`)
            .then(r => r.json())
            .then(data => {
              if (!data.html) throw new Error(data.error || "no html");
              item.classList.remove("is-loading");
              item.innerHTML = data.html;
              if (window.instgrm) window.instgrm.Embeds.process();
            })
            .catch(() => {
              item.classList.remove("is-loading");
              item.innerHTML = \`<div class="cs-feed__error"><a href="\${url}" target="_blank" rel="noopener">View on Instagram ↗</a></div>\`;
            });
        }, i * 120);
      });
      const s = document.createElement("script");
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    })();
    </script>`;
}

function renderMeta(meta) {
  if (!meta || !Object.keys(meta).length) return "";
  const rows = Object.entries(meta)
    .filter(([, v]) => v && v.trim() && v.trim() !== "—")
    .map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("\n");
  return `      <dl class="cs-meta">\n${rows}\n      </dl>`;
}

function renderStory(fill, hasFullStory) {
  const text = fill ? `        <h1 class="cs-story__text">${esc(fill)}</h1>` : "";
  const btn  = hasFullStory
    ? `        <button class="cs-pill" type="button" data-open="story">Read the full story ${EXPAND}</button>`
    : "";
  return `      <section class="cs-story">\n${text}\n${btn}\n      </section>`;
}

function renderImpact(cards) {
  if (!cards?.length) return "";
  const items = cards.map(c => `        <div class="cs-impact__card is-placeholder">
          ${ARROW}
          <div class="cs-impact__card__body">
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.body)}</p>
          </div>
        </div>`).join("\n");
  return `
    <section class="cs-impact">
      <div class="cs-impact__head"><h2>Impact</h2></div>
      <div class="cs-impact__track">
${items}
      </div>
    </section>`;
}

function renderRelated(related) {
  related = (related || []).filter(n => n.image);
  if (!related.length) return "";
    const cards = related.map((n, i) => {
    const imgUrl = n.image ? imgFit(n.image, 900, 82) : "";
    const imgTag = imgUrl ? `<img src="${imgUrl}" alt="" loading="lazy">` : "";
    const tx = i === 0 ? "0%" : "25%";
    const tz = `${-Math.min(i, 4) * 200}px`;
    const ry = i === 0 ? "0deg" : "-25deg";
    const op = i <= 1 ? "1" : "0";
    return `          <div class="cs-flipbook-card${i === 0 ? " is-active" : ""}" aria-hidden="true" style="--tx:${tx};--tz:${tz};--ry:${ry};--op:${op};z-index:${100 - i * 10}">
            ${imgTag}
            <div class="cs-flipbook-card__label">${esc(n.title)}</div>
          </div>`;
  }).join("\n");
  const slides = related.map((n) =>
    `          <a class="cs-flipbook-slide" href="${esc(n.href)}" draggable="false" aria-label="${esc(n.title)}"></a>`
  ).join("\n");
  return `
    <section class="cs-more">
      <div class="cs-more__head">
        <h1 class="cs-more__title">More Work</h1>
        <p class="cs-more__sub">Swipe to browse</p>
      </div>
      <div class="cs-flipbook-wrap">
        <div class="cs-flipbook-stage">
          <div class="cs-flipbook-stack">
${cards}
          </div>
        </div>
        <div class="cs-flipbook-scroller">
${slides}
        </div>
      </div>
    </section>`;
}

function renderGallerySheet(title, gallery) {
  if (!gallery?.length) return "";
  const figs = gallery.map((src, i) =>
    `        <figure${i % 3 === 0 ? ' class="full"' : ""}>${media(src, imgFill(src, 1400, null, 85), ' loading="lazy"')}</figure>`
  ).join("\n");
  return `
  <dialog class="cs-sheet" data-key="gallery" aria-label="${esc(title)} gallery">
    <button class="cs-sheet__close" type="button" aria-label="Close">${CLOSE}</button>
    <div class="cs-sheet__scroll">
      <div class="cs-gallery">
${figs}
      </div>
    </div>
  </dialog>`;
}

function renderStorySheet(title, story, meta) {
  if (!story?.length) return "";
  const paras = story.map((p, i) =>
    `        <p${i === 0 ? ' class="first"' : ""}>${esc(p)}</p>`
  ).join("\n");
  const credits = meta
    ? Object.entries(meta)
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => `          <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
        .join("\n")
    : "";
  const hr = credits ? `\n      <hr>\n      <dl>\n${credits}\n      </dl>` : "";
  return `
  <dialog class="cs-sheet" data-key="story" aria-label="${esc(title)}: the full story">
    <button class="cs-sheet__close" type="button" aria-label="Close">${CLOSE}</button>
    <div class="cs-sheet__scroll">
      <article class="cs-read">
${paras}${hr}
      </article>
    </div>
  </dialog>`;
}

// ── Stats row (social-media only) ─────────────────────────────────────────

function renderStats(stats) {
  if (!stats?.length) return "";
  const items = stats.map(s =>
    `      <div class="cs-stats__item"><p class="cs-stats__num">${esc(s.value)}</p><p class="cs-stats__label">${esc(s.label)}</p></div>`
  ).join("\n");
  return `\n    <div class="cs-stats">\n${items}\n    </div>`;
}

// ── Page assembly ──────────────────────────────────────────────────────────


// ── Link-preview (Open Graph) image for a project ──
function ogImage(slug, gallery) {
  const SITE = "https://flmno.com";
  const first = (gallery || [])[0];
  if (first && first.startsWith("/media/")) {
    const m = first.match(/^\/media\/[^/]+~mv2\.[a-z]+/i);
    if (m) return `${SITE}${m[0]}/v1/fill/w_1200,h_630,al_c,q_85/${m[0].split("/").pop()}`;
  }
  if (fs.existsSync(path.join(__dirname, "assets", "og", `${slug}.jpg`))) return `${SITE}/assets/og/${slug}.jpg`;
  return `${SITE}/assets/og/flmno.jpg`;
}


// ── Breadcrumb categories: read from the homepage tiles + filter labels ──
const HOME_HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const PROJECT_TAGS = {};
for (const m of HOME_HTML.matchAll(/<article class="work-item[^"]*" data-tags="([^"]*)">\s*<a[^>]*href="projects\/([^/"]+)\//g))
  PROJECT_TAGS[m[2]] = m[1].trim().split(/\s+/)[0];
const FILTER_LABELS = {};
for (const m of HOME_HTML.matchAll(/data-filter="([^"]+)">([^<]+)<\/button>/g)) FILTER_LABELS[m[1]] = m[2].trim();

function crumbsFor(slug) {
  const tag = PROJECT_TAGS[slug], label = tag && FILTER_LABELS[tag];
  const items = [`<li><a href="/#work">Work</a></li>`];
  if (label) items.push(`<li><a href="/?filter=${tag}#work">${esc(label)}</a></li>`);
  return `<nav class="cs-crumbs" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;
}

function crumbsSchema(slug, title) {
  const tag = PROJECT_TAGS[slug], label = tag && FILTER_LABELS[tag];
  const list = [{ name: "Work", item: "https://flmno.com/" }];
  if (label) list.push({ name: label, item: `https://flmno.com/?filter=${tag}` });
  list.push({ name: title, item: `https://flmno.com/projects/${slug}/` });
  return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: list.map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) }).replace(/</g, "\\u003c");
}

function buildPage(slug, project) {
  const {
    title, teaser, story = [], meta = {}, gallery = [],
    instagram_posts, related = [], impact = [], stats,
  } = project;

  // Excerpt for the scroll-lit preview: first sentence(s) up to ~240 chars
  function excerpt(text, limit = 240) {
    if (!text || text.length <= limit) return text;
    const sentences = text.split(/(?<=[.!?])\s+/);
    let out = "";
    for (const s of sentences) {
      if (out.length + s.length + 1 > limit) break;
      out = (out + " " + s).trim();
    }
    return out || text.slice(0, limit).replace(/\W+$/, "") + "…";
  }

  const fillText = story.length ? excerpt(story.join(" ")) : teaser;
  const hasGallery = gallery.length > 0;
  const hasStory   = story.length > 0;
  const hasIG      = instagram_posts?.length > 0;

  const preload = hasGallery && !isVideo(gallery[0])
    ? `\n  <link rel="preload" as="image" href="${imgFit(gallery[0], 900, 82)}">`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | flmno</title>
  <meta name="description" content="${esc(teaser || fillText || "")}">
  <link rel="canonical" href="https://flmno.com/projects/${slug}/">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="flmno">
  <meta property="og:title" content="${esc(title)} | flmno">
  <meta property="og:description" content="${esc(teaser || fillText || "")}">
  <meta property="og:url" content="https://flmno.com/projects/${slug}/">
  <meta property="og:image" content="${ogImage(slug, gallery)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${crumbsSchema(slug, title)}</script>
  <link rel="stylesheet" href="../case-study.css">${preload}
  <meta name="theme-color" content="#050507">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
<body>
  <a href="../../index.html" id="mobile-logo" aria-label="flmno home"><img src="../../assets/logos/logo-1.svg" alt="flmno" id="mobile-logo-img"></a>
  <header class="cs-header">
    <a class="cs-header__brand site-logo" href="../../index.html" id="site-logo" aria-label="flmno home"><img src="../../assets/logos/logo-1.svg" alt="flmno" id="site-logo-img"></a>
    <a class="cs-header__back" href="../../index.html#work">Get back to work</a>
  </header>

  <main>
    <div class="cs-hero-stage">
    <section class="cs-hero grid">
      <div class="cs-hero__head">
        ${crumbsFor(slug)}
        <h1 class="cs-hero__title">${esc(title)}</h1>
      </div>
${renderStory(fillText, hasStory)}
    </section>${fillText ? `\n      <div class="cs-hero-spacer" aria-hidden="true"></div>` : ""}
    </div>
${renderCarousel(gallery)}
${renderStats(stats)}
${hasIG ? renderInstagramFeed(instagram_posts) : ""}
${renderImpact(impact)}
${renderRelated(related)}
  </main>
${renderGallerySheet(title, gallery)}
${renderStorySheet(title, story, meta)}
  <script src="../case-study.js"></script>
</body>
</html>
`.replace(/\n{3,}/g, "\n\n"); // collapse excessive blank lines
}

// ── Runner ─────────────────────────────────────────────────────────────────

const targetSlug = process.argv[2] || null;
const projects   = CONTENT.projects;
let built = 0, skipped = 0;

for (const [slug, project] of Object.entries(projects)) {
  if (targetSlug && slug !== targetSlug) { skipped++; continue; }

  const dir = path.join(ROOT, "projects", slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const html = buildPage(slug, project);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log(`  built  ${slug}`);
  built++;
}

console.log(`\n✓ ${built} page${built !== 1 ? "s" : ""} built${skipped ? `, ${skipped} skipped` : ""}.`);
