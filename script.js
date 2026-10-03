const reveals=document.querySelectorAll(".reveal");
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add("visible")})},{threshold:.12});
reveals.forEach(el=>observer.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(link=>{link.addEventListener("click",event=>{const target=document.querySelector(link.getAttribute("href"));if(!target)return;event.preventDefault();target.scrollIntoView({behavior:"smooth",block:"start"});closeAllModals?.();})});

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
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('is-open');
    mobileNav.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
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
