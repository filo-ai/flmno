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

    const chars = el.querySelectorAll(".c");
    let lastN = -1;
    const update = () => {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.85 - vh * 0.35)));
      const n = Math.round(p * chars.length);
      if (n !== lastN) { chars.forEach((c, i) => c.classList.toggle("on", i < n)); lastN = n; }
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
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


/* ══ COLLINS flipbook ══ */
(() => {
  document.querySelectorAll('.cs-flipbook-wrap').forEach(wrap => {
    const stage   = wrap.querySelector('.cs-flipbook-stage');
    const cards   = [...wrap.querySelectorAll('.cs-flipbook-card')];
    const track   = wrap.querySelector('.cs-flipbook-titles-track');
    const titles  = [...wrap.querySelectorAll('.cs-flipbook-title')];
    if (!cards.length) return;

    let active = 0;
    let pointerDown = false, startX = 0, currentX = 0, moved = false;

    function render(dragOffset = 0) {
      cards.forEach((card, i) => {
        const delta = i - active;
        const dragging = dragOffset !== 0;
        const influence = dragOffset / 280;
        const d = delta - influence;
        const abs = Math.abs(d);
        const dir = d < 0 ? -1 : 1;

        card.classList.toggle('is-active', delta === 0 && Math.abs(dragOffset) < 50);

        if (delta === 0) {
          card.style.setProperty('--tx', `${dragOffset * 0.35}px`);
          card.style.setProperty('--tz', '0px');
          card.style.setProperty('--ry', `${dragOffset * -0.02}deg`);
          card.style.setProperty('--op', '1');
        } else {
          const tx = dir * Math.min(Math.abs(d), 3) * 25;
          const tz = -Math.min(Math.abs(d), 4) * 200;
          card.style.setProperty('--tx', `${tx}%`);
          card.style.setProperty('--tz', `${tz}px`);
          card.style.setProperty('--ry', `${dir * -25}deg`);
          card.style.setProperty('--op', abs <= 1 ? '0.22' : '0');
        }
        card.style.zIndex = 50 - Math.round(Math.abs(delta));
      });

      // Move title track
      if (track) track.style.transform = `translateX(${-active * 160}px)`;
      titles.forEach((t, i) => t.classList.toggle('is-active', i === active));
    }

    render();

    // Drag on stage
    stage.addEventListener('pointerdown', e => {
      pointerDown = true; moved = false;
      startX = e.clientX; currentX = 0;
      stage.classList.add('is-dragging');
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!pointerDown) return;
      currentX = e.clientX - startX;
      if (Math.abs(currentX) > 6) moved = true;
      render(currentX);
    });
    function finishDrag() {
      if (!pointerDown) return;
      pointerDown = false;
      stage.classList.remove('is-dragging');
      const n = cards.length;
      if (currentX < -80 && active < n - 1) active++;
      else if (currentX > 80 && active > 0) active--;
      currentX = 0;
      render(0);
      setTimeout(() => { moved = false; }, 80);
    }
    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    stage.addEventListener('mouseleave', finishDrag);

    // Click inactive card → bring to front; click active → navigate
    cards.forEach((card, i) => {
      card.addEventListener('click', e => {
        if (moved) { e.preventDefault(); e.stopPropagation(); return; }
        if (i !== active) {
          e.preventDefault(); e.stopPropagation();
          active = i; render(0);
        }
        // if active, allow navigation
      }, true);
    });

    // Click title
    titles.forEach((t, i) => {
      t.addEventListener('click', () => { active = i; render(0); });
    });
  });
})();

/* ══ Cycling logo on project pages ══ */
(function () {
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

/* ── Swipe down to close sheet on mobile ── */
document.querySelectorAll(".cs-sheet").forEach((sheet) => {
  let startY = 0, currentY = 0, dragging = false;

  sheet.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    currentY = 0;
    dragging = true;
  }, { passive: true });

  sheet.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY > 0) {
      sheet.style.transform = `translateY(${currentY}px)`;
      sheet.style.transition = "none";
    }
  }, { passive: true });

  sheet.addEventListener("touchend", () => {
    dragging = false;
    sheet.style.transition = "";
    if (currentY > 120) {
      // Close properly — same as the X button
      sheet.style.transform = "";
      sheet.classList.remove("is-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      setTimeout(() => {
        try { sheet.close(); } catch(e) {}
      }, 500);
    } else {
      sheet.style.transform = "";
    }
    currentY = 0;
  });
});

  sheet.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY > 0) {
      sheet.style.transform = `translateY(${currentY}px)`;
      sheet.style.transition = "none";
    }
  }, { passive: true });

  sheet.addEventListener("touchend", () => {
    dragging = false;
    sheet.style.transition = "";
    if (currentY > 120) {
      sheet.classList.remove("is-open");
      sheet.style.transform = "";
      setTimeout(() => { try { sheet.close(); } catch(e){} }, 500);
    } else {
      sheet.style.transform = "";
    }
    currentY = 0;
  });
});
