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

function wixFit(url, h = 900, q = 82) {
  // Fit to height, preserve aspect ratio — no crop
  if (!url) return url;
  if (!url.includes("static.wixstatic.com/media/")) return url; // local path — pass through
  if (url.includes("/v1/fit/")) return url;
  const m = url.match(/https:\/\/static\.wixstatic\.com\/media\/[^/]+~mv2\.[a-z]+/);
  if (!m) return url;
  const base = m[0];
  const fname = base.split("/").pop();
  return `${base}/v1/fit/h_${h},q_${q},usm_0.33_1.00_0.20,enc_avif,quality_auto/${fname}`;
}

function wix(url, w, h, q = 82) {
  if (!url) return url;
  if (!url.includes("static.wixstatic.com/media/")) return url; // local path — pass through
  if (url.includes("/v1/fill/")) return url;
  const fname = url.split("/").pop();
  const dims  = h ? `w_${w},h_${h}` : `w_${w}`;
  return `${url}/v1/fill/${dims},al_c,q_${q},usm_0.33_1.00_0.20,enc_avif,quality_auto/${fname}`;
}

const ARROW  = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EXPAND = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 1h5v5M6 13H1V8"/></svg>`;
const CLOSE  = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg>`;

// ── Sections ────────────────────────────────────────────────────────────────

function renderCarousel(gallery) {
  if (!gallery?.length) return "";
  const slides = gallery.slice(0, 3).map(src =>
    `      <button class="cs-carousel__item" type="button" data-open="gallery" aria-label="Open gallery">` +
    `<img src="${wixFit(src, 900, 82)}" alt="" loading="eager" draggable="false"></button>`
  ).join("\n");

  const rest   = gallery.slice(3).length ? gallery.slice(3) : gallery;
  const thumbs = [...rest, ...rest, ...rest].slice(0, 3);
  const thumbHtml = thumbs.map(t =>
    `          <span class="cs-explore__thumb"><img src="${wix(t, 280, 280, 75)}" alt="" loading="lazy" draggable="false"></span>`
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
  const text = fill ? `        <p class="cs-story__text">${esc(fill)}</p>` : "";
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
  if (!related?.length) return "";
  const cards = related.map(n => {
    const imgUrl = n.image ? wix(n.image, 800, 800, 80) : "";
    const imgStyle = imgUrl ? ` style="--image:url('${imgUrl}')"` : "";
    return `        <a class="cs-related__card" href="${esc(n.href)}" draggable="false">
          <div class="cs-related__card__img"${imgStyle}></div>
          <div class="cs-related__card__frost">
            <p>Project</p>
            <h3>${esc(n.title)}</h3>
          </div>
        </a>`;
  }).join("\n");
  return `
    <section class="cs-more">
      <div class="cs-more__head">
        <h2 class="cs-more__title">More Work</h2>
        <p class="cs-more__sub">Drag or scroll to browse</p>
      </div>
      <div class="cs-related">
${cards}
      </div>
    </section>`;
}

function renderGallerySheet(title, gallery) {
  if (!gallery?.length) return "";
  const figs = gallery.map((src, i) =>
    `        <figure${i % 3 === 0 ? ' class="full"' : ""}><img src="${wix(src, 1400, null, 85)}" alt="" loading="lazy"></figure>`
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

  const preload = hasGallery
    ? `\n  <link rel="preload" as="image" href="${wix(gallery[0], 900, 600, 82)}">`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | flmno</title>
  <link rel="stylesheet" href="../case-study.css">${preload}
  <link rel="icon" type="image/gif" href="../../assets/favicon.gif">
</head>
<body>
  <header class="cs-header">
    <a class="cs-header__brand site-logo" href="../../index.html" id="site-logo" aria-label="flmno home"><img src="../../assets/logos/logo-1.svg" alt="flmno" id="site-logo-img"></a>
    <a class="cs-header__back filter-pill" href="../../index.html#work">Get back to work</a>
  </header>

  <main>
    <section class="cs-hero grid">
      <hgroup class="cs-hero__head">
        <h1 class="cs-hero__title">${esc(title)}</h1>${teaser ? `\n        <p class="cs-hero__thesis">${esc(teaser)}</p>` : ""}
      </hgroup>
    </section>
${renderCarousel(gallery)}
${renderStats(stats)}
    <div class="cs-body grid">
${renderMeta(meta)}
${renderStory(fillText, hasStory)}
    </div>
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
