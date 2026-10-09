const __RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* flmno case study — interactions */
(() => {
  /* ── Sheets (gallery + story), URL-synced like ?gallery=true ── */
  const sheets = {};
  document.querySelectorAll(".cs-sheet").forEach((sheet) => {
    const key = sheet.dataset.key;
    sheets[key] = sheet;

    const close = () => {
      if (!sheet.open) return;
      sheet.classList.remove("is-open");
      document.documentElement.style.overflow = "";
      const url = new URL(location.href);
      url.searchParams.delete(key);
      history.replaceState(null, "", url);
      setTimeout(() => sheet.close(), 500);
    };
    sheet._close = close;

    sheet.querySelector(".cs-sheet__close").addEventListener("click", close);
    sheet.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
  });

  function open(key) {
    const sheet = sheets[key];
    if (!sheet || sheet.open) return;
    sheet.showModal();
    sheet.querySelector(".cs-sheet__scroll").scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("is-open")));
    const url = new URL(location.href);
    url.searchParams.set(key, "true");
    history.replaceState(null, "", url);
  }

  document.querySelectorAll("[data-open]").forEach((el) =>
    el.addEventListener("click", () => open(el.dataset.open))
  );

  /* ── Gallery sheet: iOS-style drag — follows the finger, background lightens, flick or pull to dismiss ── */
  const IOS = "cubic-bezier(0.32, 0.72, 0, 1)";
  Object.values(sheets).filter((s) => s.querySelector(".cs-sheet__head")).forEach((sheet) => {
    const head = sheet.querySelector(".cs-sheet__head");
    const scroller = sheet.querySelector(".cs-sheet__scroll");
    let armed = false, dragging = false, fromHead = false, y0 = 0, dy = 0, lastY = 0, lastT = 0, v = 0;
    const paint = (y) => {
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${y}px)`;
      sheet.style.setProperty("--drag", Math.max(0, Math.min(1, y / sheet.offsetHeight)).toFixed(3));
    };
    const clear = () => { sheet.style.transform = ""; sheet.style.transition = ""; sheet.style.removeProperty("--drag"); };
    const start = (y, onHead) => {
      if (sheet.dataset.zoom || !sheet.classList.contains("is-open")) return;
      armed = true; dragging = false; fromHead = onHead; y0 = lastY = y; dy = 0; v = 0; lastT = performance.now();
    };
    const move = (y, e) => {
      if (!armed) return;
      const d = y - y0;
      if (!dragging) {
        if (d > 6 && (fromHead || scroller.scrollTop <= 0)) { dragging = true; y0 = y; }
        else if (Math.abs(d) > 6) { armed = false; return; }
        else return;
      }
      if (e.cancelable) e.preventDefault();
      const raw = y - y0;
      dy = raw >= 0 ? raw : -Math.pow(-raw, 0.6);           // pulling up meets a soft resistance
      const now = performance.now();
      v = 0.8 * ((y - lastY) / Math.max(1, now - lastT)) + 0.2 * v;
      lastY = y; lastT = now;
      paint(dy);
    };
    const end = () => {
      if (!armed) return;
      armed = false;
      if (!dragging) return;
      dragging = false;
      const h = sheet.offsetHeight;
      if (dy > h * 0.25 || (v > 0.5 && dy > 24)) {
        const ms = Math.max(180, Math.min(380, (h - dy) / Math.max(v, 1.2)));
        sheet.style.transition = `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
        sheet.style.transform = "translateY(100%)";
        sheet.style.setProperty("--drag", "1");
        sheet._close();
        setTimeout(clear, 520);
      } else {
        sheet.style.transition = `transform 0.5s ${IOS}`;
        sheet.style.transform = "translateY(0)";
        sheet.style.setProperty("--drag", "0");
        setTimeout(() => { if (!dragging) clear(); }, 520);
      }
    };
    sheet.addEventListener("touchstart", (e) => start(e.touches[0].clientY, !!e.target.closest(".cs-sheet__head")), { passive: true });
    sheet.addEventListener("touchmove", (e) => move(e.touches[0].clientY, e), { passive: false });
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", end);
    // mouse: drag the top bar
    head.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.target.closest("button")) return;
      start(e.clientY, true);
      const mm = (ev) => move(ev.clientY, ev);
      const mu = () => { end(); removeEventListener("pointermove", mm); removeEventListener("pointerup", mu); };
      addEventListener("pointermove", mm); addEventListener("pointerup", mu);
    });
  });

  /* ── Swipe down to close sheet (story sheet) ── */
  Object.values(sheets).filter((s) => !s.querySelector(".cs-sheet__head")).forEach((sheet) => {
    let startY = 0, dy = 0, active = false;
    sheet.addEventListener("touchstart", (e) => {
      if (sheet.dataset.zoom) { active = false; return; }
      startY = e.touches[0].clientY; dy = 0; active = true;
    }, { passive: true });
    sheet.addEventListener("touchmove", (e) => {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy > 0) { sheet.style.cssText += `transform:translateY(${dy}px);transition:none`; }
    }, { passive: true });
    sheet.addEventListener("touchend", () => {
      active = false;
      sheet.style.transform = "";
      sheet.style.transition = "";
      if (dy > 160) sheet._close();
      dy = 0;
    });
  });

  const params = new URLSearchParams(location.search);
  Object.keys(sheets).forEach((k) => { if (params.get(k) === "true") open(k); });

  /* ── Gallery layout: landscapes full width, portraits paired ── */
  const gallery = document.querySelector(".cs-gallery");
  if (gallery) {
    const figs = [...gallery.children];
    const layout = () => {
      let run = [];
      const flush = () => { if (run.length % 2) run[run.length - 1].classList.add("full"); run = []; };
      figs.forEach((f) => {
        const img = f.querySelector("img");
        f.classList.remove("full");
        const wide = img.naturalWidth && img.naturalWidth / img.naturalHeight > 1.15;
        if (wide) { flush(); f.classList.add("full"); } else run.push(f);
      });
      flush();
    };
    figs.forEach((f) => f.querySelector("img").addEventListener("load", layout));
    layout();
  }

  /* ── Carousel: native scroll + drag with momentum ── */
  document.querySelectorAll(".cs-carousel").forEach((el) => {
    let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, v = 0, raf;

    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;           // touch uses native scrolling
      down = true; moved = false;
      startX = lastX = e.clientX; startScroll = el.scrollLeft; v = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add("is-dragging"); }
      if (moved) { el.scrollLeft = startScroll - dx; v = e.clientX - lastX; lastX = e.clientX; }
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      el.classList.remove("is-dragging");
      const glide = () => {
        if (Math.abs(v) < 0.4) return;
        el.scrollLeft -= v; v *= 0.93;
        raf = requestAnimationFrame(glide);
      };
      glide();
      // swallow the click that follows a drag
      const swallow = (e) => { e.stopPropagation(); e.preventDefault(); };
      el.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 60);
    });
  });

  /* ── Story text: first sentence in serif, rest in sans, scroll-lit ── */
  document.querySelectorAll(".cs-story__text").forEach((el) => {
    const raw = el.textContent.trim();

    // Split on the first sentence boundary (. ! ?)
    const m = raw.match(/^(.+?[.!?])\s+([\s\S]+)$/) || [null, raw, ""];
    const [, first, rest] = m;

    // Wrap each character in a span for the lit effect
    const wrapChars = (text, cls) =>
      text.split(/\s+/).map((word) =>
        `<span class="w ${cls}">${[...word].map((c) =>
          `<span class="c">${c === "&" ? "&amp;" : c === "<" ? "&lt;" : c}</span>`
        ).join("")}</span>`
      ).join(" ");

    el.innerHTML = wrapChars(first, "s1") + (rest ? " " + wrapChars(rest, "s2") : "");

    el.classList.add("is-lighting");                 // JS is running: button waits for the reveal
    const chars  = el.querySelectorAll(".c");
    const stage  = el.closest(".cs-hero-stage");
    const hero   = el.closest(".cs-hero");
    const spacer = stage && stage.querySelector(".cs-hero-spacer");
    let lastN = -1, ticking = false;

    // Pin the hero exactly where it sits on load, so it holds still while lighting up
    const pinAt = () => {
      if (stage && hero) hero.style.top = Math.max(0, stage.getBoundingClientRect().top + scrollY) + "px";
    };

    const update = () => {
      const dist   = spacer && spacer.offsetHeight ? spacer.offsetHeight : 0;
      const raw    = dist ? Math.min(1, Math.max(0, scrollY / dist)) : 1;
      const eased  = 1 - Math.pow(1 - raw, 1.45);              // same curve as the homepage
      const n      = raw >= .985 ? chars.length : Math.floor(eased * chars.length);
      if (n !== lastN) { chars.forEach((c, i) => c.classList.toggle("on", i < n)); lastN = n; }
      if (raw >= .985) el.classList.add("is-lit");      // stays revealed once shown
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", () => { pinAt(); update(); });
    pinAt();
    update();
  });

  /* ── Related projects: horizontal scroll strip with drag + momentum ── */
  document.querySelectorAll(".cs-related").forEach((el) => {
    let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, v = 0, raf;

    el.addEventListener("pointerdown", (e) => {
      down = true; moved = false;
      startX = lastX = e.clientX; startScroll = el.scrollLeft; v = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add("is-dragging"); }
      if (moved) { el.scrollLeft = startScroll - dx; v = lastX - e.clientX; lastX = e.clientX; }
    });
    window.addEventListener("pointerup", () => {
      if (!down) return; down = false;
      if (!moved) return;
      el.classList.remove("is-dragging");
      const glide = () => {
        if (Math.abs(v) < 0.3) return;
        el.scrollLeft += v; v *= 0.9;
        raf = requestAnimationFrame(glide);
      };
      glide();
      el.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
      setTimeout(() => { moved = false; }, 80);
    });
  });
})();

  /* ── Impact track drag ── */
  document.querySelectorAll(".cs-impact__track").forEach((el) => {
    let down = false, startX = 0, startScroll = 0, v = 0, moved = false, raf;
    el.addEventListener("pointerdown", (e) => {
      down = true; moved = false;
      startX = e.clientX; startScroll = el.scrollLeft; v = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add("is-dragging"); }
      if (moved) { el.scrollLeft = startScroll - dx; v = -(e.clientX - startX - (moved ? dx : 0)) || (el.scrollLeft - (startScroll - dx)); }
    });
    window.addEventListener("pointerup", () => {
      if (!down) return; down = false;
      if (!moved) return;
      el.classList.remove("is-dragging");
    });
  });

/* ── First-visit interaction hints ── */
(function () {
  const ARROW_LR = `<svg width="28" height="10" viewBox="0 0 28 10" fill="none" aria-hidden="true"><path d="M1 5h26M21 1l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 1L3 5l4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function showHint(el, text, key, delay) {
    try { if (localStorage.getItem("hint_" + key)) return; } catch(e) {}

    const hint = document.createElement("div");
    hint.className = "hint hint--below";
    hint.innerHTML = ARROW_LR + `<span>${text}</span>`;
    el.style.position = "relative";
    el.appendChild(hint);

    setTimeout(() => {
      hint.classList.add("is-visible");

      const hideTimer = setTimeout(() => {
        hint.classList.remove("is-visible");
        hint.classList.add("is-hiding");
        setTimeout(() => hint.remove(), 550);
        try { localStorage.setItem("hint_" + key, "1"); } catch(e) {}
      }, 2800);

      const dismiss = () => {
        clearTimeout(hideTimer);
        hint.classList.remove("is-visible");
        hint.classList.add("is-hiding");
        setTimeout(() => hint.remove(), 550);
        try { localStorage.setItem("hint_" + key, "1"); } catch(e) {}
      };
      el.addEventListener("pointerdown", dismiss, { once: true });
      el.addEventListener("scroll", dismiss, { once: true, passive: true });
      el.addEventListener("touchstart", dismiss, { once: true, passive: true });
    }, delay);
  }

  const carousel = document.querySelector(".cs-carousel");
  if (carousel) showHint(carousel, "Drag or scroll to browse", "carousel", 900);

  const related = document.querySelector(".cs-related");
  if (related) showHint(related, "Drag or scroll to browse", "related", 1000);

  const impact = document.querySelector(".cs-impact__track");
  if (impact) showHint(impact, "Drag or scroll to browse", "impact", 1100);
})();

/* ── Random logo frame on each page load ── */
(function () {
  const FRAMES = 4;
  const frame  = Math.floor(Math.random() * FRAMES);
  const padded = String(frame).padStart(2, "0");
  // Resolve path relative to current page
  const isProject = location.pathname.includes("/projects/");
  const base = isProject ? "../../assets/logo-frames/" : "/assets/logo-frames/";
  const logo = document.getElementById("nav-logo");
  if (logo) logo.src = base + "f" + padded + ".webp";
})();


/* ══ COLLINS flipbook — scroll-driven ══ */
(() => {
  document.querySelectorAll('.cs-flipbook-wrap').forEach(wrap => {
    const scroller = wrap.querySelector('.cs-flipbook-scroller');
    const slides   = [...wrap.querySelectorAll('.cs-flipbook-slide')];
    const cards    = [...wrap.querySelectorAll('.cs-flipbook-card')];
    if (!scroller || !cards.length) return;

    let slideW = 1, ticking = false;
    const progress = () => scroller.scrollLeft / slideW;
    const activeIndex = () => Math.round(progress());

    function measure() {
      slideW = (cards[0].offsetWidth || 300) * 0.55;   // shorter swipe per card = cards keep up with the finger
      scroller.style.setProperty('--fb-w', slideW + 'px');
    }

    function render() {
      const p = progress();
      cards.forEach((card, i) => {
        const d = i - p, abs = Math.abs(d), dir = d < 0 ? -1 : 1, k = Math.min(abs, 1);
        card.style.setProperty('--tx', `${dir * k * 25}%`);
        card.style.setProperty('--tz', `${-Math.min(abs, 4) * 200}px`);
        card.style.setProperty('--ry', `${-dir * k * 25}deg`);
        card.style.setProperty('--op', String(Math.max(0, Math.min(1, 2 - abs))));
        card.style.zIndex = String(100 - Math.round(abs * 10));
        card.classList.toggle('is-active', abs < 0.5);
      });
    }

    scroller.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { render(); ticking = false; });
    }, { passive: true });

    // Desktop mouse drag with inertia (touch + trackpad use native scrolling)
    let down = false, dragged = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, vel = 0;
    scroller.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; dragged = false; vel = 0;
      startX = lastX = e.clientX; startLeft = scroller.scrollLeft; lastT = performance.now();
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; scroller.classList.add('is-dragging'); }
      if (!dragged) return;
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(now - lastT, 1);
      lastX = e.clientX; lastT = now;
      scroller.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!dragged) return;
      const projected = (scroller.scrollLeft - vel * 350) / slideW;   // longer, gliding throw
      const target = Math.max(0, Math.min(slides.length - 1, Math.round(projected)));
      scroller.scrollTo({ left: target * slideW, behavior: __RM ? 'auto' : 'smooth' });
      setTimeout(() => scroller.classList.remove('is-dragging'), 450);
    });

    // Tap: front card opens the project; a side card slides to the front
    slides.forEach((slide, i) => {
      slide.addEventListener('click', e => {
        if (dragged) { e.preventDefault(); dragged = false; return; }
        if (i !== activeIndex()) {
          e.preventDefault();
          scroller.scrollTo({ left: i * slideW, behavior: __RM ? 'auto' : 'smooth' });
        }
      });
    });

    window.addEventListener('resize', () => {
      const idx = activeIndex();
      measure();
      scroller.scrollLeft = idx * slideW;
      render();
    });

    measure();
    render();
  });
})();

/* ══ Cycling logo on project pages ══ */
(function () {
  if (__RM) return;
  const TOTAL = 7, STEP = 40, BASE = '../../assets/logos/logo-';
  let idx = 1, dir = 1, lastStep = 0;
  function setLogo(n) {
    document.querySelectorAll('#site-logo-img, #mobile-logo-img').forEach(img => {
      if (img) img.src = BASE + n + '.svg';
    });
  }
  window.addEventListener('scroll', () => {
    const s = Math.floor(window.scrollY / STEP);
    const delta = s - lastStep;
    if (!delta) return;
    lastStep = s;
    for (let i = 0; i < Math.abs(delta); i++) {
      idx += dir;
      if (idx >= TOTAL) { idx = TOTAL; dir = -1; }
      else if (idx <= 1) { idx = 1; dir = 1; }
    }
    setLogo(idx);
  }, { passive: true });
})();

/* ── Block image saving in gallery ── */
document.addEventListener('contextmenu', e => {
  if (e.target.closest('.cs-sheet, .cs-gallery')) {
    e.preventDefault();
  }
});

/* ── "Swipe to browse" hint: fades a few seconds after the flipbook is seen, or on first swipe ── */
(() => {
  const hint = document.querySelector('.cs-more__sub');
  const wrap = document.querySelector('.cs-flipbook-wrap');
  if (!hint || !wrap) return;
  let done = false;
  const fade = () => { if (!done) { done = true; hint.classList.add('is-faded'); } };
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { obs.disconnect(); setTimeout(fade, 3500); }
  }, { threshold: 0.5 }).observe(wrap);
  wrap.querySelector('.cs-flipbook-scroller')?.addEventListener('scroll', () => setTimeout(fade, 600), { once: true, passive: true });
})();

/* ── Measure the pinned mobile title bar so content starts right below it ── */
(() => {
  const head = document.querySelector('.cs-hero__head');
  if (!head) return;
  // measure at full size only, so the page doesn't jump when the bar shrinks
  const set = () => { if (!head.classList.contains('is-compact')) document.documentElement.style.setProperty('--cs-titlebar-h', head.offsetHeight + 'px'); };

  // Title stays large while the story lights up; once lit, the story text scrolls up into the
  // bar and pushes it smaller 1:1 with scroll (mobile). Scroll-linked, so it reverses naturally.
  const mq = matchMedia('(max-width: 680px)');
  const crumbs = head.querySelector('.cs-crumbs');
  let crumbsH = 0, range = 70, ticking = false;
  const measure = () => { if (!head.style.getPropertyValue('--k') || head.style.getPropertyValue('--k') === '0.0000' || head.style.getPropertyValue('--k') === '0') { crumbsH = crumbs ? crumbs.offsetHeight : 0; head.style.setProperty('--ch', crumbsH + 'px');
    if (mq.matches) { const full = head.offsetHeight; head.style.setProperty('--k', '1'); range = Math.max(1, full - head.offsetHeight); head.style.setProperty('--k', '0'); } } };
  const update = () => {
    ticking = false;
    const spacer = document.querySelector('.cs-hero-spacer');
    const dist = spacer ? spacer.offsetHeight : 0;
    if (!mq.matches) { head.style.removeProperty('--k'); head.classList.remove('is-compact'); document.documentElement.style.removeProperty('--title-k'); return; }
    const start = dist + 4;                               // text meets the bar's bottom edge
    const k = Math.min(1, Math.max(0, (scrollY - start) / range));
    head.style.setProperty('--k', k.toFixed(4));
    head.classList.toggle('is-compact', k >= 1);
    document.documentElement.style.setProperty('--title-k', k.toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', () => { measure(); update(); });
  measure(); update();
  set();
  addEventListener('resize', set);
  document.fonts?.ready.then(set);
})();

/* ── Gallery: live image counter + arrow-key navigation ── */
(() => {
  const sheet = document.querySelector('.cs-sheet[data-key="gallery"]');
  if (!sheet) return;
  const scroll = sheet.querySelector('.cs-sheet__scroll');
  const figs = [...sheet.querySelectorAll('.cs-gallery figure')];
  const out = sheet.querySelector('.cs-sheet__count-n');
  if (!scroll || !figs.length) return;
  let current = 0;
  const ratios = new Map();
  const show = (i) => { current = i; if (out) out.textContent = String(i + 1); };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
    let best = 0, bestR = -1;
    figs.forEach((f, i) => { const r = ratios.get(f) || 0; if (r > bestR + 0.001) { bestR = r; best = i; } });
    show(best);
  }, { root: scroll, threshold: [0, .25, .5, .75, 1] });
  figs.forEach((f) => io.observe(f));

  document.addEventListener('keydown', (e) => {
    if (!sheet.open || sheet.dataset.zoom) return;
    const next = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const prev = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (!next && !prev) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(figs.length - 1, current + (next ? 1 : -1)));
    figs[i].scrollIntoView({ block: 'center', behavior: __RM ? 'auto' : 'smooth' });
    show(i);
  });
})();

/* ══ Reading progress: the line under the title fills as you read ══ */
(() => {
  const head = document.querySelector('.cs-hero__head');
  if (!head) return;
  let t = false;
  const set = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    head.style.setProperty('--read', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : '0');
    t = false;
  };
  addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(set); } }, { passive: true });
  addEventListener('resize', set);
  set();
})();


/* ══ Gallery: full-screen viewer — tap to open, pinch/double-tap to zoom, swipe for next ══ */
(() => {
  const sheet = document.querySelector('.cs-sheet[data-key="gallery"]');
  const zoom = sheet && sheet.querySelector('.cs-zoom');
  if (!zoom) return;
  const img = zoom.querySelector('.cs-zoom__img');
  const figs = [...sheet.querySelectorAll('.cs-gallery figure')].filter(f => f.querySelector('img'));
  if (!figs.length) return;
  let index = 0, z = 1, px = 0, py = 0;
  const apply = () => { img.style.setProperty('--z', z); img.style.setProperty('--x', px + 'px'); img.style.setProperty('--y', py + 'px'); };
  const reset = () => { z = 1; px = 0; py = 0; apply(); };
  const show = (i) => {
    index = (i + figs.length) % figs.length;
    const src = figs[index].querySelector('img');
    img.src = src.getAttribute('src'); img.alt = src.alt; reset();
    const n = zoom.querySelector('.cs-zoom__count-n'); if (n) n.textContent = String(index + 1);
  };
  const open = (i) => {
    show(i); zoom.hidden = false; sheet.dataset.zoom = '1';
    requestAnimationFrame(() => zoom.classList.add('is-open'));
  };
  const close = () => {
    zoom.classList.remove('is-open'); delete sheet.dataset.zoom;
    setTimeout(() => { zoom.hidden = true; img.removeAttribute('src'); }, 250);
  };
  figs.forEach((f, i) => f.addEventListener('click', () => open(i)));
  zoom.querySelector('.cs-zoom__close').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  sheet.addEventListener('cancel', (e) => { if (sheet.dataset.zoom) { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  document.addEventListener('keydown', (e) => {
    if (!sheet.dataset.zoom) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(index - 1); }
  });
  zoom.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    z = Math.min(4, Math.max(1, z * (1 - e.deltaY * 0.01)));
    if (z === 1) { px = 0; py = 0; }
    apply();
  }, { passive: false });
  const pts = new Map();
  let start = null, lastTap = 0, moved = false;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  zoom.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.cs-zoom__close')) return;
    zoom.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zoom.classList.add('is-gesturing');
    moved = false;
    start = { x: e.clientX, y: e.clientY, px, py, z, d: pts.size === 2 ? dist() : 0 };
  });
  zoom.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      if (!start.d) start.d = dist();
      z = Math.min(4, Math.max(1, start.z * dist() / start.d)); moved = true;
    } else {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
      if (z > 1) { px = start.px + dx; py = start.py + dy; }
    }
    apply();
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size) { const p = [...pts.values()][0]; start = { x: p.x, y: p.y, px, py, z, d: 0 }; return; }
    zoom.classList.remove('is-gesturing');
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (z <= 1.02) {
      reset();
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { show(index + (dx < 0 ? 1 : -1)); return; }
    }
    if (!moved) {
      const now = Date.now();
      if (now - lastTap < 300) { z = z > 1 ? 1 : 2.5; if (z === 1) { px = 0; py = 0; } apply(); lastTap = 0; }
      else lastTap = now;
    }
  };
  zoom.addEventListener('pointerup', end);
  zoom.addEventListener('pointercancel', end);
})();

/* ── Flipbook: the card under the pointer shows its label (cards sit beneath the swipe layer) ── */
document.querySelectorAll('.cs-flipbook-wrap').forEach((wrap) => {
  const cards = [...wrap.querySelectorAll('.cs-flipbook-card')];
  wrap.querySelectorAll('.cs-flipbook-slide').forEach((slide, i) => {
    slide.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && cards[i]) cards[i].classList.add('is-hover'); });
    slide.addEventListener('pointerleave', () => { if (cards[i]) cards[i].classList.remove('is-hover'); });
  });
});

/* ── Mobile: nav buttons ease smaller while scrolling down, back to full size on scroll up ── */
(() => {
  const mq = matchMedia('(max-width: 680px)');
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, dy = y - lastY;
      if (!mq.matches || y < 40) document.documentElement.classList.remove('nav-compact');
      else if (dy > 4) document.documentElement.classList.add('nav-compact');
      else if (dy < -4) document.documentElement.classList.remove('nav-compact');
      if (Math.abs(dy) > 4) lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();

/* ── No saving images anywhere on project pages ── */
document.addEventListener('contextmenu', (e) => { if (e.target.closest('img, video, .cs-carousel__item, .cs-gallery figure, .cs-flipbook-wrap, .cs-zoom')) e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (e.target.closest('img, video, .cs-carousel__item, .cs-flipbook-wrap')) e.preventDefault(); });

/* ── Screenshot deterrent: images go dark when a screenshot shortcut is pressed or the page loses focus ── */
(() => {
  const root = document.documentElement;
  let t;
  const on = (ms) => { root.classList.add('img-shield'); clearTimeout(t); if (ms) t = setTimeout(off, ms); };
  const off = () => { clearTimeout(t); root.classList.remove('img-shield'); };
  addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    if (k === 'printscreen' || k === 'snapshot' ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5', '6', 's', '#', '$', '%', '^'].includes(k)) ||
        (e.metaKey && e.shiftKey) ) on(3000);
    if (k === 'printscreen') { try { navigator.clipboard.writeText(''); } catch (_) {} }
  }, true);
  addEventListener('keyup', (e) => { if ((e.key || '').toLowerCase() === 'printscreen') { on(3000); try { navigator.clipboard.writeText(''); } catch (_) {} } }, true);
  // snipping tools and screen-capture apps take focus away from the page
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('blur', () => on());
    addEventListener('focus', () => setTimeout(off, 150));
  }
  document.addEventListener('visibilitychange', () => { document.hidden ? on() : setTimeout(off, 150); });
  addEventListener('beforeprint', () => on());
  addEventListener('afterprint', () => off());
})();

/* ── "Coming soon" pill: read the image under it; light image → dark text ── */
(() => {
  const pills = document.querySelectorAll('.tile-soon');
  if (!pills.length) return;
  const cv = document.createElement('canvas'); cv.width = 24; cv.height = 12;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const check = (pill, img) => {
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      // bottom-left area of the picture, where the pill sits
      cx.clearRect(0, 0, 24, 12);
      cx.drawImage(img, 0, h * 0.78, w * 0.5, h * 0.22, 0, 0, 24, 12);
      const d = cx.getImageData(0, 0, 24, 12).data;
      let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 16) continue; sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; n++; }
      if (n) pill.classList.toggle('is-light', sum / n > 0.6);
    } catch (e) {}
  };
  pills.forEach((pill) => {
    const host = pill.closest('.work-tile, .cs-flipbook-card');
    const img = host && host.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth) check(pill, img);
    else img.addEventListener('load', () => check(pill, img), { once: true });
  });
})();
