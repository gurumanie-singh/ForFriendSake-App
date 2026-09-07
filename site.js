/* ForFriendSake site behaviour. No libraries.
   Nav scroll state, reveal, progress bar, optional coral particle field. */

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function motionToken(name, fallback) {
  const n = parseFloat(getComputedStyle(root).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}

function initNavState() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;";
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => {
    nav.classList.toggle("is-scrolled", !entry.isIntersecting);
  }, { threshold: 0 }).observe(sentinel);
}

function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("navPanel");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  const STAGGER_STEP = motionToken("--stagger-step", 60);
  const STAGGER_CAP = motionToken("--stagger-cap", 4);
  const ENTER_MS = motionToken("--dur-enter", 320);

  const show = (el) => {
    el.style.willChange = "opacity, translate";
    el.classList.add("is-visible");
    const settle = () => { el.style.willChange = ""; };
    el.addEventListener("transitionend", settle, { once: true });
    window.setTimeout(settle, ENTER_MS + 100);
  };

  if (reduceMotion.matches) {
    els.forEach(show);
    return;
  }

  const orderIndex = (el) => {
    const group = el.closest("[data-reveal-group]");
    const scope = group
      ? Array.from(group.querySelectorAll("[data-reveal]"))
      : (el.parentElement ? Array.from(el.parentElement.children) : []);
    return Math.max(0, scope.indexOf(el));
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Math.min(orderIndex(entry.target), STAGGER_CAP) * STAGGER_STEP;
      window.setTimeout(() => show(entry.target), delay);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -48px 0px" });

  els.forEach((el) => observer.observe(el));
}

function initProgressBar() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function hexToRgb(hex) {
  let h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function initParticleField(host) {
  if (!host || reduceMotion.matches) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return null; }

  const LINK_DIST = 96;
  const LINK_MAX = 0.08;
  const DOT_ALPHA = 0.22;
  const count = () => (window.innerWidth <= 768 ? 18 : 36);
  let width = 0, height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let rgb = { r: 236, g: 119, b: 86 };
  let rafId = null;
  let inView = true;
  let visible = !document.hidden;

  const parsed = hexToRgb(getComputedStyle(root).getPropertyValue("--pin-deep"));
  if (parsed) rgb = parsed;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const velocity = () => {
    const v = rand(0.08, 0.22);
    return Math.random() < 0.5 ? -v : v;
  };

  const build = () => {
    particles = [];
    for (let i = 0, n = count(); i < n; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: velocity(),
        vy: velocity(),
        r: rand(0.8, 1.6),
      });
    }
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };

  const draw = () => {
    rafId = null;
    if (!inView || !visible) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x <= 0 || p.x >= width) { p.vx *= -1; p.x = Math.max(0, Math.min(width, p.x)); }
      if (p.y <= 0 || p.y >= height) { p.vy *= -1; p.y = Math.max(0, Math.min(height, p.y)); }
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * LINK_MAX;
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${DOT_ALPHA})`;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  };

  const start = () => { if (rafId == null && inView && visible) rafId = requestAnimationFrame(draw); };
  const stop = () => { if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; } };

  let resizeTimer = null;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resize();
      start();
    }, 150);
  };
  window.addEventListener("resize", onResize);

  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) start(); else stop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) start(); else stop();
  }, { threshold: 0 });
  io.observe(canvas);

  const onReduceChange = (e) => {
    if (!e.matches) return;
    stop();
    io.disconnect();
    window.removeEventListener("resize", onResize);
    canvas.remove();
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", onReduceChange);

  resize();
  start();
}

document.addEventListener("DOMContentLoaded", () => {
  initNavState();
  initMobileMenu();
  initReveal();
  initProgressBar();
  const hero = document.querySelector(".hero");
  if (hero) initParticleField(hero);
});
