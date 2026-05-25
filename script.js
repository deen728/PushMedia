const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const menuButton = document.querySelector("[data-menu-toggle]");

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 16);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menu?.classList.toggle("open", !expanded);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !menu?.classList.contains("open")) return;
  menu.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.focus();
});

window.addEventListener("resize", () => {
  if (window.innerWidth <= 1080 || !menu?.classList.contains("open")) return;
  menu.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((node) => node.classList.add("shown"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("shown");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
  reveals.forEach((node) => observer.observe(node));
}

const numberNodes = document.querySelectorAll("[data-count]");
if (!reducedMotion && numberNodes.length && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      const end = Number(node.dataset.count);
      const start = performance.now();
      const duration = 900;
      const tick = (time) => {
        const ratio = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - ratio, 3);
        node.textContent = Math.round(end * eased).toLocaleString();
        if (ratio < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(node);
    });
  }, { threshold: 0.7 });
  numberNodes.forEach((node) => counterObserver.observe(node));
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});
