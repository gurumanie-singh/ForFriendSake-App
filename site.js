/* ForFriendSake site behaviour. No libraries. */

const root = document.documentElement;

function initThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const sync = () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  };
  sync();

  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("ffs-theme", next); } catch (e) {}
    sync();
  });
}

function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("navPanel");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
  panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// The dots start filled in the markup, so without JS (or with reduced
// motion) the diagram is already complete.
function initRing() {
  const ring = document.getElementById("ring");
  if (!ring || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  ring.classList.add("will-fill");
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    ring.classList.add("is-filled");
    obs.disconnect();
  }, { threshold: 0.6 }).observe(ring);
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMobileMenu();
  initRing();
});
