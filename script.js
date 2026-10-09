const __RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll(".reveal");
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add("visible")})},{threshold:.12});
reveals.forEach(el=>observer.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(link=>{link.addEventListener("click",event=>{const target=document.querySelector(link.getAttribute("href"));if(!target)return;event.preventDefault();target.scrollIntoView({behavior: __RM ? 'auto' : 'smooth',block:"start"});closeAllModals?.();})});

const fullText="I am a multidisciplinary graphic designer bringing magic to the mundane with insight & imagination at the center of my practice.";
const headline=document.getElementById("scrollHeadline");
const headlineSpacer=document.querySelector(".headline-scroll-spacer");
let lastCharsVisible=-1;

function renderHeadline(charsVisible){
  if(!headline||charsVisible===lastCharsVisible)return;
  lastCharsVisible=charsVisible;

  headline.innerHTML=fullText.split("").map((char,index)=>{
    const visible=index<charsVisible;
    const safeChar=char==="&"?"&amp;":char==="<"?"&lt;":char===">"?"&gt;":char;
    return `<span class="scroll-char ${visible?"visible":""}">${safeChar}</span>`;
  }).join("");
}

function animateHeadlineOnScroll(){
  if(!headline)return;

  const totalChars=fullText.length;
  const heroStage=document.querySelector(".hero-pin-stage");
  const spacerHeight=heroStage ? Math.max(1, heroStage.offsetHeight - window.innerHeight) : (headlineSpacer ? headlineSpacer.offsetHeight : window.innerHeight * .8);

  /*
    The hero stays sticky while this progresses. Once all characters
    are revealed, body gets headline-complete and the page scrolls normally.
  */
  const rawProgress=Math.min(1,window.scrollY / spacerHeight);
  const easedProgress=1-Math.pow(1-rawProgress,1.45);
  const charsVisible=Math.min(totalChars,Math.floor(easedProgress*totalChars));

  renderHeadline(charsVisible);
  document.body.classList.toggle("headline-complete", rawProgress >= .985);
  if (rawProgress >= .985) document.body.classList.add("nav-revealed");

  requestAnimationFrame(animateHeadlineOnScroll);
}

renderHeadline(0);
setTimeout(()=>requestAnimationFrame(animateHeadlineOnScroll),500);

const contactColors=["#FAF3C7","#EFF7C6","#E4FAC8","#DAFCCD","#D1FED5","#CBFFDE","#C7FFE9","#C7FFE9","#C6FEF4","#C8FCFF","#CDFAFF","#D5F7FF","#DEF3FF","#E9F0FF","#F4ECFF","#F4ECFF","#FFE9FF","#FFE7FF","#FFE5FF","#FFE4FF","#FFE4FA","#FFE5EF","#FFE7E4","#FFE9DA","#FFECD1","#FFF0CB"];
let contactColorIndex=0;
const contactInputs=document.querySelectorAll("#input2,#input3,#textBox1");
function cycleContactBackground(){const nextColor=contactColors[contactColorIndex];document.body.classList.add("contact-mode");document.body.style.setProperty("--contact-bg",nextColor);contactColorIndex=(contactColorIndex+1)%contactColors.length}
contactInputs.forEach(input=>{input.addEventListener("input",cycleContactBackground);input.addEventListener("focus",cycleContactBackground);input.addEventListener("click",cycleContactBackground)});

const modalBackdrop=document.getElementById("modalBackdrop");
const modalButtons=document.querySelectorAll("[data-modal]");
const modals=document.querySelectorAll(".apple-modal");
const closeButtons=document.querySelectorAll(".modal-close");

function closeAllModals(){modals.forEach(modal=>modal.classList.remove("active"));if(modalBackdrop)modalBackdrop.classList.remove("active");document.body.classList.remove("modal-open")}
modalButtons.forEach(button=>{button.addEventListener("click",()=>{const modal=document.getElementById(button.dataset.modal);if(!modal)return;closeAllModals();modal.classList.add("active");modalBackdrop.classList.add("active");document.body.classList.add("modal-open")})});
closeButtons.forEach(button=>button.addEventListener("click",closeAllModals));
modalBackdrop?.addEventListener("click",closeAllModals);
window.addEventListener("keydown",event=>{if(event.key==="Escape")closeAllModals()});


const scribblePath = document.querySelector(".scribble-draw");
const scribbleSection = document.querySelector(".scribble-section");

if (scribblePath && scribbleSection) {
  const scribbleLength = scribblePath.getTotalLength();

  scribblePath.style.strokeDasharray = scribbleLength;
  scribblePath.style.strokeDashoffset = scribbleLength;

  function animateScribbleOnScroll() {
    const rect = scribbleSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    /*
      Delay the animation until the scribble is comfortably visible.
      It stays fully gray until the section top reaches about 38% down
      the viewport, then completes as the section moves upward.
    */
    const start = windowHeight * 0.38;
    const end = -rect.height * 0.18;

    const rawProgress = (start - rect.top) / (start - end);
    const progress = Math.min(1, Math.max(0, rawProgress));

    scribblePath.style.strokeDashoffset = scribbleLength * (1 - progress);

    scribbleSection.classList.toggle("is-drawing", progress > 0.03 && progress < 0.98);
    scribbleSection.classList.toggle("is-complete", progress >= 0.98);

    requestAnimationFrame(animateScribbleOnScroll);
  }

  requestAnimationFrame(animateScribbleOnScroll);
}


const cardRevealItems = document.querySelectorAll(".card-reveal");

// Lower threshold on mobile so cards trigger as soon as they enter the viewport
const isMobile = window.innerWidth < 768;
const cardRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("card-visible");
    }
  });
}, {
  threshold: 0.01,
  rootMargin: '0px'
});

cardRevealItems.forEach((item) => cardRevealObserver.observe(item));

// Safety net: after 1.2s, any card still invisible gets shown
// (catches cases where IntersectionObserver fires before layout is ready)
setTimeout(() => {
  cardRevealItems.forEach((item) => {
    if (!item.classList.contains("card-visible")) {
      item.classList.add("card-visible");
    }
  });
}, 300);


document.querySelectorAll(".project-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.add("leaving-page");
  });
});


const filterButtons = document.querySelectorAll(".filter-pill");
const filterItems = document.querySelectorAll(".work-item");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));

    filterItems.forEach((item, index) => {
      const tags = (item.dataset.tags || "").split(" ");
      const show = filter === "all" || tags.includes(filter);

      item.classList.toggle("is-hidden", !show);

      if (show) {
        item.classList.remove("card-visible");
        item.style.setProperty("--card-delay", `${Math.min(index * 35, 250)}ms`);
        requestAnimationFrame(() => item.classList.add("card-visible"));
      }
    });
  });
});


/* --- reveal hero arrow after headline animation completes --- */
(() => {
  const cue = document.querySelector(".hero-scroll-cue");
  const headline = document.querySelector("#scrollHeadline");
  if (!cue) return;

  function showCue(){
    cue.classList.add("is-visible");
  }

  if (!headline) {
    setTimeout(showCue, 1400);
    return;
  }

  function checkHeadlineComplete(){
    const chars = headline.querySelectorAll("span");
    if (!chars.length) {
      setTimeout(showCue, 1600);
      return;
    }

    const visibleChars = Array.from(chars).filter((span) => {
      const color = getComputedStyle(span).color;
      return color === "rgb(255, 255, 255)" || span.classList.contains("visible") || span.classList.contains("is-visible");
    });

    if (visibleChars.length >= chars.length * 0.96) {
      showCue();
      return;
    }

    requestAnimationFrame(checkHeadlineComplete);
  }

  requestAnimationFrame(checkHeadlineComplete);
})();

/* ── Hamburger nav ── */
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.site-nav nav');
if (hamburger && mobileNav) {
  function closeNav() {
    hamburger.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('is-open');
    mobileNav.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  const closePill = mobileNav.querySelector('.nav-close-pill');
  if (closePill) closePill.addEventListener('click', closeNav);
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('is-open');
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ── Image lightbox ── */
(function () {
  const lb      = document.getElementById("img-lightbox");
  const lbImg   = lb?.querySelector(".img-lightbox__img");
  const lbCap   = lb?.querySelector(".img-lightbox__caption");
  const lbClose = lb?.querySelector(".img-lightbox__close");
  if (!lb) return;

  function open(src, title) {
    lbImg.src = src;
    lbImg.alt = title;
    lbCap.textContent = title;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    // Force reflow so transition fires
    lb.offsetHeight;
    lb.style.opacity = "1";
    lbClose.focus();
  }

  function close() {
    lb.style.opacity = "0";
    document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; lbImg.src = ""; }, 300);
  }

  document.querySelectorAll(".lightbox-tile").forEach(btn => {
    btn.addEventListener("click", () => {
      open(btn.dataset.lightboxSrc, btn.dataset.lightboxTitle);
    });
  });

  lbClose.addEventListener("click", close);
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) close(); });
})();

/* ── Splash screen ── */
(function () {
  const splash = document.getElementById("splash");
  if (!splash) return;
  if (document.documentElement.classList.contains("splash-seen")) { splash.remove(); return; }
  try { sessionStorage.setItem("flmno-splash", "1"); } catch (e) {}

  // Let the GIF play for at least 1.4s, then wait for page load — whichever is longer
  const minTime = new Promise(r => setTimeout(r, 1400));
  const pageLoad = new Promise(r => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once: true });
  });

  Promise.all([minTime, pageLoad]).then(() => {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 650);
  });
})();

/* ── First-visit interaction hints ── */
(function () {
  const ARROW_LR = `<svg width="28" height="10" viewBox="0 0 28 10" fill="none" aria-hidden="true"><path d="M1 5h26M21 1l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 1L3 5l4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function showHint(el, text, key, position = "below", delay = 700) {
    // Only show once per key, ever
    try { if (localStorage.getItem("hint_" + key)) return; } catch(e) {}

    const hint = document.createElement("div");
    hint.className = "hint hint--" + position;
    hint.innerHTML = ARROW_LR + `<span>${text}</span>`;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";   // keep sticky/absolute elements as they are
    el.appendChild(hint);

    // Fade in after delay
    const showTimer = setTimeout(() => {
      hint.classList.add("is-visible");

      // Fade out after 2.8s
      const hideTimer = setTimeout(() => {
        hint.classList.remove("is-visible");
        hint.classList.add("is-hiding");
        setTimeout(() => hint.remove(), 550);
        try { localStorage.setItem("hint_" + key, "1"); } catch(e) {}
      }, 2800);

      // Also dismiss immediately on first interaction
      const dismiss = () => {
        clearTimeout(hideTimer);
        hint.classList.remove("is-visible");
        hint.classList.add("is-hiding");
        setTimeout(() => hint.remove(), 550);
        try { localStorage.setItem("hint_" + key, "1"); } catch(e) {}
        el.removeEventListener("pointerdown", dismiss);
        el.removeEventListener("scroll", dismiss);
        el.removeEventListener("touchstart", dismiss);
      };
      el.addEventListener("pointerdown", dismiss, { once: true });
      el.addEventListener("scroll", dismiss, { once: true, passive: true });
      el.addEventListener("touchstart", dismiss, { once: true, passive: true });
    }, delay);
  }

  // Homepage: filter bar nudge
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) showHint(filterBar, "Filter by discipline", "filter", "below", 1200);

  // Project pages: carousel, related strip, impact track
  const carousel = document.querySelector(".cs-carousel");
  if (carousel) showHint(carousel, "Drag or scroll to browse", "carousel", "below", 900);

  const related = document.querySelector(".cs-related");
  if (related) showHint(related, "Drag or scroll to browse", "related", "below", 900);

  const impact = document.querySelector(".cs-impact__track");
  if (impact) showHint(impact, "Drag or scroll to browse", "impact", "below", 900);
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


/* ── Logo cycles on keypress or input typing ── */
(function () {
  const FRAMES = 4;
  let current = parseInt(document.getElementById('nav-logo')?.src.match(/f(\d+)\.webp/)?.[1] || '0');
  
  function nextFrame() {
    const logo = document.getElementById('nav-logo');
    if (!logo) return;
    current = (current + 1) % FRAMES;
    const padded = String(current).padStart(2, '0');
    const isProject = location.pathname.includes('/projects/');
    const base = isProject ? '../../assets/logo-frames/' : '/assets/logo-frames/';
    logo.src = base + 'f' + padded + '.webp';
  }

  // Change on any keydown anywhere on the page
  document.addEventListener('keydown', nextFrame);
  
  // Change on input in text fields
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', nextFrame);
  });
})();

/* ── Active nav link based on scroll section ── */
(function () {
  const links = {
    work:    document.querySelector('.site-nav nav a[href="#work"]'),
    about:   document.querySelector('.site-nav nav a[href="#about"]'),
    contact: document.querySelector('.site-nav nav a[href="#contact"]'),
  };
  const sections = {
    work:    document.getElementById('work'),
    about:   document.getElementById('about'),
    contact: document.getElementById('contact'),
  };

  function setActive(id) {
    Object.values(links).forEach(l => l?.classList.remove('is-active'));
    if (links[id]) links[id].classList.add('is-active');
  }

  // Use scroll position to determine active section — more reliable than threshold
  function updateActive() {
    const scrollMid = scrollY + innerHeight * 0.35;
    const order = ['work', 'about', 'contact'];
    let active = 'work';
    for (const id of order) {
      const el = sections[id];
      if (el && el.getBoundingClientRect().top + scrollY <= scrollMid) {
        active = id;
      }
    }
    setActive(active);
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive(); // run on load
})();







/* ══ Cycling logo: boomerang 1→7→1→7 on scroll ══ */
(function () {
  if (__RM) return;
  const TOTAL = 7;
  const STEP  = 40;
  let idx     = 0; // 0-indexed internally
  let dir     = 1;
  let lastScrollStep = 0;

  function setLogo(n) {
    const img = document.getElementById('site-logo-img') || document.querySelector('#mobile-logo img');
    document.querySelectorAll('#site-logo-img, #mobile-logo-img').forEach(i => { if(i) i.src = '/assets/logos/logo-' + n + '.svg'; });
  }

  window.addEventListener('scroll', () => {
    const currentStep = Math.floor(window.scrollY / STEP);
    const delta = currentStep - lastScrollStep;
    if (delta === 0) return;
    lastScrollStep = currentStep;

    for (let i = 0; i < Math.abs(delta); i++) {
      idx += dir;
      if (idx >= TOTAL - 1) { idx = TOTAL - 1; dir = -1; }
      else if (idx <= 0)    { idx = 0;          dir =  1; }
    }
    setLogo(idx + 1);
  }, { passive: true });
})();

/* ── Block right-click / long-press save on all images ── */
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

/* ── Contact form: send via /api/contact, inline status ── */
(() => {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.contact-status');
  const say = (html) => { status.innerHTML = html; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.email || !data.message) { say('Add your email and a message, and I’ll take it from there.'); return; }
    btn.disabled = true; btn.textContent = 'Sending…'; say('');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      form.reset();
      btn.textContent = 'Sent';
      say('Thank you. I’ll be in touch soon.');
      setTimeout(() => { btn.textContent = 'Send'; btn.disabled = false; }, 4000);
    } catch {
      btn.textContent = 'Send'; btn.disabled = false;
      say('Something went wrong. You can email me at <a href="mailto:hello@flmno.com">hello@flmno.com</a>.');
    }
  });
})();

/* ── Phone top bar (theme-color + root background) follows the page color ── */
(() => {
  const meta = document.querySelector('meta[name="theme-color"]');
  const DARK = '#050507';
  const sync = () => {
    const c = document.body.classList.contains('contact-mode')
      ? (document.body.style.getPropertyValue('--contact-bg').trim() || '#b8f0e0')
      : DARK;
    if (meta && meta.content !== c) meta.setAttribute('content', c);
    document.documentElement.style.backgroundColor = c;
  };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
  sync();
})();

/* ── Nav reveal: no scroll-lit animation under reduced motion, so show nav right away ── */
if (__RM) document.body.classList.add("nav-revealed");

/* ── Open the grid pre-filtered when arriving from a breadcrumb (?filter=…) ── */
(() => {
  const f = new URLSearchParams(location.search).get('filter');
  if (!f) return;
  const pill = document.querySelector(`.filter-pill[data-filter="${CSS.escape(f)}"]`);
  if (pill) pill.click();
})();

/* ── Motion tiles: play a quiet loop on hover (desktop) ── */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || __RM) return;
  document.querySelectorAll('.work-tile.has-motion').forEach((tile) => {
    const m = tile.querySelector('.tile-motion');
    if (!m) return;
    tile.addEventListener('pointerenter', () => {
      if (m.tagName === 'VIDEO') {
        m.currentTime = 0;
        m.play().then(() => tile.classList.add('is-playing')).catch(() => {});
      } else {
        if (!m.src) { m.onload = () => tile.matches(':hover') && tile.classList.add('is-playing'); m.src = m.dataset.src; }
        else tile.classList.add('is-playing');
      }
    });
    tile.addEventListener('pointerleave', () => {
      tile.classList.remove('is-playing');
      if (m.tagName === 'VIDEO') setTimeout(() => { if (!tile.classList.contains('is-playing')) m.pause(); }, 400);
    });
  });
})();

/* ── Footer year stays current ── */
document.querySelectorAll('.js-year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ── Return to where you were in the grid after viewing a project ── */
(() => {
  const KEY = 'flmno-return';
  // remember position + filter whenever a project is opened from the homepage
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="projects/"]');
    if (!a) return;
    const f = document.querySelector('.filter-pill.is-active');
    try { sessionStorage.setItem(KEY, JSON.stringify({ y: scrollY, f: f ? f.dataset.filter : 'all' })); } catch (err) {}
  }, true);

  // coming back from a project: land in place with nothing animating, then fade the page in calmly
  const root = document.documentElement;
  const settle = () => {
    document.querySelectorAll('.card-reveal').forEach((c) => c.classList.add('card-visible'));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!root.classList.contains('is-returning')) return;
      root.classList.remove('is-returning');
      root.classList.add('is-returned');
      setTimeout(() => { root.classList.remove('is-returned'); root.style.scrollBehavior = ''; }, 700);
    }));
  };
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (err) {}
  const fromProject = root.classList.contains('is-returning');
  if (!fromProject) return;
  if (!saved || new URLSearchParams(location.search).get('filter')) {
    const target = location.hash && document.querySelector(location.hash);
    if (target && !new URLSearchParams(location.search).get('filter')) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    settle();
    return;
  }
  try { sessionStorage.removeItem(KEY); } catch (err) {}
  if (saved.f && saved.f !== 'all') {
    const pill = document.querySelector(`.filter-pill[data-filter="${CSS.escape(saved.f)}"]`);
    if (pill) pill.click();
  }
  const go = () => window.scrollTo({ top: saved.y, behavior: 'instant' });
  go();
  settle();
  addEventListener('load', () => requestAnimationFrame(go), { once: true });
})();

/* ── Mobile: measure the nav row (left of Work → right of Contact) for the Send button ── */
(() => {
  const links = document.querySelectorAll('.site-nav nav a');
  if (links.length < 2) return;
  const set = () => {
    if (document.documentElement.classList.contains('nav-compact')) return;   // measure only at full size
    const first = links[0].getBoundingClientRect(), last = links[links.length - 1].getBoundingClientRect();
    const span = Math.round(last.right - first.left);
    if (span > 0) document.documentElement.style.setProperty('--nav-span', span + 'px');
  };
  set();
  addEventListener('resize', set);
  document.fonts && document.fonts.ready.then(set);
})();

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
  const pills = document.querySelectorAll('.tile-soon, .svc-pill, .svc-plus');
  if (!pills.length) return;
  const cv = document.createElement('canvas'); cv.width = 24; cv.height = 12;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const check = (pill, img) => {
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      // the exact pixels under the pill (object-fit: cover mapping), with a little margin
      cx.clearRect(0, 0, 24, 12);
      const ir = img.getBoundingClientRect(), pr = pill.getBoundingClientRect();
      let sx, sy, sw, sh;
      if (ir.width && pr.width) {
        const sc = Math.max(ir.width / w, ir.height / h);
        const ox = (ir.width - w * sc) / 2, oy = (ir.height - h * sc) / 2;
        sx = (pr.left - ir.left - ox - 6) / sc; sy = (pr.top - ir.top - oy - 6) / sc;
        sw = (pr.width + 12) / sc; sh = (pr.height + 12) / sc;
        sx = Math.max(0, Math.min(w - 1, sx)); sy = Math.max(0, Math.min(h - 1, sy));
        sw = Math.max(1, Math.min(w - sx, sw)); sh = Math.max(1, Math.min(h - sy, sh));
      } else if (pill.classList.contains('svc-plus')) { sx = w * 0.8; sy = 0; sw = w * 0.2; sh = h * 0.2; }
      else { sx = 0; sy = h * 0.72; sw = w * 0.6; sh = h * 0.28; }
      cx.drawImage(img, sx, sy, sw, sh, 0, 0, 24, 12);
      const d = cx.getImageData(0, 0, 24, 12).data;
      let sum = 0, n = 0, bright = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 16) continue; const L = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; sum += L; if (L > 0.62) bright++; n++; }
      // dark text when the area is light overall, or when a good share of it is bright (snow, sky, paper)
      if (n) pill.classList.toggle('is-light', sum / n > 0.55 || bright / n > 0.3);
    } catch (e) {}
  };
  pills.forEach((pill) => {
    const host = pill.closest('.work-tile, .cs-flipbook-card, .apple-card');
    const img = host && host.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth) check(pill, img);
    else img.addEventListener('load', () => check(pill, img), { once: true });
  });
})();

/* ── Service sheets: drag down to dismiss (follows the finger, flick or pull past a quarter to close) ── */
(() => {
  const backdrop = document.getElementById('modalBackdrop');
  document.querySelectorAll('.apple-modal').forEach((sheet) => {
    let armed = false, dragging = false, y0 = 0, dy = 0, lastY = 0, lastT = 0, v = 0;
    const paint = (y) => { sheet.style.setProperty('transition', 'none', 'important'); sheet.style.setProperty('transform', `translateY(${y}px)`, 'important'); backdrop && backdrop.style.setProperty('--drag', Math.max(0, Math.min(1, y / sheet.offsetHeight)).toFixed(3)); };
    const clear = () => { sheet.style.removeProperty('transition'); sheet.style.removeProperty('transform'); backdrop && backdrop.style.removeProperty('--drag'); };
    sheet.addEventListener('touchstart', (e) => {
      if (!sheet.classList.contains('active')) return;
      armed = true; dragging = false; y0 = lastY = e.touches[0].clientY; dy = 0; v = 0; lastT = performance.now();
    }, { passive: true });
    sheet.addEventListener('touchmove', (e) => {
      if (!armed) return;
      const y = e.touches[0].clientY, d = y - y0;
      if (!dragging) {
        if (d > 6 && sheet.scrollTop <= 0) { dragging = true; y0 = y; }
        else if (Math.abs(d) > 6) { armed = false; return; }
        else return;
      }
      if (e.cancelable) e.preventDefault();
      const raw = y - y0;
      dy = raw >= 0 ? raw : -Math.pow(-raw, 0.6);
      const now = performance.now(); v = 0.8 * ((y - lastY) / Math.max(1, now - lastT)) + 0.2 * v; lastY = y; lastT = now;
      paint(dy);
    }, { passive: false });
    const end = () => {
      if (!armed) return; armed = false;
      if (!dragging) return; dragging = false;
      const h = sheet.offsetHeight;
      if (dy > h * 0.25 || (v > 0.5 && dy > 24)) {
        const ms = Math.max(180, Math.min(380, (h - dy) / Math.max(v, 1.2)));
        sheet.style.setProperty('transition', `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0s linear ${ms}ms`, 'important');
        sheet.style.setProperty('transform', 'translateY(calc(100% + 20px))', 'important');
        if (typeof closeAllModals === 'function') closeAllModals();
        setTimeout(clear, ms + 40);
      } else {
        sheet.style.setProperty('transition', 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)', 'important');
        sheet.style.setProperty('transform', 'translateY(0)', 'important');
        backdrop && backdrop.style.setProperty('--drag', '0');
        setTimeout(() => { if (!dragging) clear(); }, 520);
      }
    };
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
  });
})();
document.querySelectorAll('.apple-modal a[href^="#"]').forEach((a) => a.addEventListener('click', () => { if (typeof closeAllModals === 'function') closeAllModals(); }));

/* ── Service sheets: "See … work" closes the sheet, filters the grid, and scrolls to it (no reload) ── */
document.querySelectorAll('.apple-modal a[data-filter-to]').forEach((a) => a.addEventListener('click', (e) => {
  const pill = document.querySelector(`.filter-pill[data-filter="${CSS.escape(a.dataset.filterTo)}"]`);
  const work = document.getElementById('work');
  if (!pill || !work) return;
  e.preventDefault();
  closeAllModals();
  pill.click();
  history.replaceState(null, '', `/?filter=${a.dataset.filterTo}#work`);
  setTimeout(() => work.scrollIntoView({ behavior: __RM ? 'auto' : 'smooth', block: 'start' }), 250);
}));

/* ── Filter bar: the chosen tag slides to the centre of the row (matters on phones, where the row scrolls) ── */
(() => {
  const bar = document.querySelector('.filter-bar');
  if (!bar) return;
  const centre = (pill, smooth) => {
    const b = bar.getBoundingClientRect(), r = pill.getBoundingClientRect();
    const left = bar.scrollLeft + (r.left - b.left) - (b.width - r.width) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: smooth && !__RM ? 'smooth' : 'auto' });
  };
  bar.querySelectorAll('.filter-pill').forEach((p) => p.addEventListener('click', () => centre(p, true)));
  const active = bar.querySelector('.filter-pill.is-active');
  if (active) requestAnimationFrame(() => centre(active, false));
})();
