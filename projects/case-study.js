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

  /* ── Swipe down to close sheet ── */
  Object.values(sheets).forEach((sheet) => {
    let startY = 0, dy = 0, active = false;
    sheet.addEventListener("touchstart", (e) => {
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
      slideW = cards[0].offsetWidth || 300;
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
      const projected = (scroller.scrollLeft - vel * 250) / slideW;
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
