/* =========================================================
   CORSO — Front-end behaviors
   - Sticky nav: scroll state + active section via IO
   - Mobile menu: toggle, scroll lock, ESC close, link close
   - Entrance: nav reveal on first paint
   ========================================================= */

(function () {
  "use strict";

  const header     = document.querySelector("[data-header]");
  const navToggle  = document.querySelector("[data-nav-toggle]");
  const navPanel   = document.querySelector("[data-nav-panel]");
  const navLinks   = document.querySelectorAll("[data-nav-link]");
  const sections   = document.querySelectorAll("main section[id], main header[id]");

  if (!header) return;

  /* -----------------------------------------------------
     1) Entrance reveal
     ----------------------------------------------------- */
  requestAnimationFrame(() => {
    header.classList.add("is-loaded");
  });

  /* -----------------------------------------------------
     2) Scroll state (throttled via rAF)
     ----------------------------------------------------- */
  let lastY = 0;
  let ticking = false;

  function onScroll() {
    lastY = window.scrollY || window.pageYOffset;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle("is-scrolled", lastY > 24);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -----------------------------------------------------
     3) Mobile menu toggle
     ----------------------------------------------------- */
  function setOpen(open) {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = header.classList.contains("is-open");
      setOpen(!isOpen);
    });
  }

  // Close menu when a nav link is clicked (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (header.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      if (navToggle) navToggle.focus();
    }
  });

  // Close if viewport grows past breakpoint
  const mq = window.matchMedia("(min-width: 992px)");
  const onMq = (e) => { if (e.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else if (mq.addListener) mq.addListener(onMq);

  /* -----------------------------------------------------
     4) Active section highlight (IntersectionObserver)
     ----------------------------------------------------- */
  if ("IntersectionObserver" in window && sections.length) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const target = href.startsWith("#") ? href.slice(1) : "";
        link.classList.toggle("is-active", target === id);
      });
    };

    // Special: highlight "Home" when at the very top
    const atTop = () => (window.scrollY || 0) < window.innerHeight * 0.3;

    const observer = new IntersectionObserver(
      (entries) => {
        if (atTop()) {
          setActive("top");
          return;
        }
        // Pick the entry with the largest intersectionRatio that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // Trigger when section crosses the upper third of the viewport
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* -----------------------------------------------------
     5) Hero carousel
     ----------------------------------------------------- */
  const carousel = document.querySelector("[data-hero-carousel]");
  if (carousel) {
    const slides = carousel.querySelectorAll(".hero-carousel__slide");
    const dots   = carousel.querySelectorAll("[data-hero-goto]");
    const prev   = carousel.querySelector("[data-hero-prev]");
    const next   = carousel.querySelector("[data-hero-next]");
    const total  = slides.length;
    const INTERVAL = 6000;
    let current = 0;
    let timer = null;
    let visible = true;

    const goTo = (i) => {
      current = ((i % total) + total) % total;
      slides.forEach((s, idx) => s.classList.toggle("is-active", idx === current));
      dots.forEach((d, idx) => {
        d.classList.toggle("is-active", idx === current);
        d.setAttribute("aria-selected", idx === current ? "true" : "false");
      });
    };

    const start = () => {
      stop();
      if (!visible) return;
      timer = setInterval(() => goTo(current + 1), INTERVAL);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    if (prev) prev.addEventListener("click", () => { goTo(current - 1); start(); });
    if (next) next.addEventListener("click", () => { goTo(current + 1); start(); });
    dots.forEach((d, idx) =>
      d.addEventListener("click", () => { goTo(idx); start(); })
    );

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(current - 1); start(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); start(); }
    });

    // Pause when off-screen
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) start(); else stop();
        },
        { threshold: 0.25 }
      );
      io.observe(carousel);
    } else {
      start();
    }
  }

  /* -----------------------------------------------------
     6) GSAP animations — one place, once GSAP is ready.
        Each section gets its own distinct treatment
        instead of one fade-up repeated everywhere, plus
        two light scroll-linked (scrub) touches.
     ----------------------------------------------------- */
  const heroItems = document.querySelectorAll("[data-hero-content] > *");
  const heroMedia = document.querySelector("[data-hero-media]");
  const revealEls = document.querySelectorAll("[data-reveal]");

  function runAnimations() {
    const gsap = window.gsap;

    if (!gsap) {
      // No GSAP: fall back to a plain IntersectionObserver reveal
      heroItems.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
      if (heroMedia) { heroMedia.style.opacity = "1"; heroMedia.style.transform = "none"; }

      if ("IntersectionObserver" in window && revealEls.length) {
        const revealIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
                revealIO.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
        );
        revealEls.forEach((el) => revealIO.observe(el));
      } else {
        revealEls.forEach((el) => el.classList.add("is-revealed"));
      }
      return;
    }

    const hasScrollTrigger = !!window.ScrollTrigger;
    if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // ---- Hero entrance (single timeline, explicit fromTo so it always
    //      lands on a visible end-state regardless of the CSS starting point).
    //      Text and image start together and settle together — a single,
    //      short, cohesive wave instead of a long overlapping relay. ----
    const heroTl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (heroItems.length) {
      heroTl.fromTo(
        heroItems,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.09, clearProps: "transform" },
        0
      );
    }
    if (heroMedia) {
      heroTl.fromTo(
        heroMedia,
        { y: 22, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.95, clearProps: "transform" },
        0.12
      );
    }

    if (!hasScrollTrigger) return; // everything below needs ScrollTrigger

    // ---- Hero background: slow parallax while the hero is in view ----
    const heroBg = document.querySelector(".hero__bg-image");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    }

    // ---- Section headers: eyebrow → H2 → lead, staggered fade-up ----
    document.querySelectorAll(".section-head").forEach((head) => {
      if (!head.children.length) return;
      gsap.set(head, { opacity: 1 });
      gsap.fromTo(
        head.children,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: head, start: "top 85%", once: true },
        }
      );
    });

    // ---- Two-column rows (register / discover / summary / seminars):
    //      the column slides in from its side, its own children stagger in slightly ----
    document.querySelectorAll('[data-reveal="left"], [data-reveal="right"]').forEach((col) => {
      // The summary section's right column wraps the timeline, which gets
      // its own dedicated per-item treatment below — just unlock its own
      // opacity (it isn't animated as a block) and skip the stagger.
      if (col.querySelector(".timeline")) {
        gsap.set(col, { opacity: 1 });
        return;
      }

      gsap.set(col, { opacity: 1 }); // only the children below are animated
      const dir = col.getAttribute("data-reveal");
      const x = dir === "left" ? -36 : 36;
      const kids = col.children.length ? Array.from(col.children) : [col];
      gsap.fromTo(
        kids,
        { x, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: col, start: "top 82%", once: true },
        }
      );
    });

    // ---- Point cards: staggered scale-in with a gentle rotation settle ----
    const pointCards = gsap.utils.toArray(".point-card");
    if (pointCards.length) {
      gsap.fromTo(
        pointCards,
        { opacity: 0, y: 28, scale: 0.92, rotate: (i) => (i % 2 === 0 ? -2.5 : 2.5) },
        {
          opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.6)",
          stagger: 0.09,
          scrollTrigger: { trigger: ".points__grid", start: "top 85%", once: true },
        }
      );
    }

    // ---- Timeline: items slide in one after another, and a colored
    //      progress line draws itself down as you scroll past the list ----
    const timelineItems = gsap.utils.toArray(".timeline__item");
    if (timelineItems.length) {
      gsap.fromTo(
        timelineItems,
        { opacity: 0, x: 26 },
        {
          opacity: 1, x: 0, duration: 0.6, ease: "power2.out", stagger: 0.18,
          scrollTrigger: { trigger: ".timeline", start: "top 80%", once: true },
        }
      );
    }
    const timelineProgress = document.querySelector(".timeline__progress");
    if (timelineProgress) {
      gsap.fromTo(
        timelineProgress,
        { scaleY: 0 },
        {
          scaleY: 1, ease: "none",
          scrollTrigger: { trigger: ".timeline", start: "top 65%", end: "bottom 75%", scrub: true },
        }
      );
    }

    // ---- Invitation & subscribe: simple, calm fade-up (kept minimal on purpose) ----
    document.querySelectorAll(".invitation__content, .subscribe__inner").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      );
    });

    // ---- Testimonials: fade + scale settle (distinct from the cards above) ----
    const testimonialCards = gsap.utils.toArray(".testimonial-card");
    if (testimonialCards.length) {
      gsap.fromTo(
        testimonialCards,
        { opacity: 0, scale: 0.92 },
        {
          opacity: 1, scale: 1, duration: 0.7, ease: "power2.out", stagger: 0.12,
          scrollTrigger: { trigger: ".testimonials__grid", start: "top 85%", once: true },
        }
      );
    }

    // ---- Takeaway cards: alternating slide-in from left/right ----
    gsap.utils.toArray(".takeaway-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, x: i % 2 === 0 ? -22 : 22 },
        {
          opacity: 1, x: 0, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        }
      );
    });

    // ---- FAQ: each row fades/rises in on its own, not as one flat block ----
    const faqList = document.querySelector(".faq__list");
    if (faqList) gsap.set(faqList, { opacity: 1 });
    const faqRows = gsap.utils.toArray(".faq-item");
    if (faqRows.length) {
      gsap.fromTo(
        faqRows,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08,
          scrollTrigger: { trigger: ".faq__list", start: "top 88%", once: true },
        }
      );
    }

    // ---- Footer columns: light, quick fade-up (kept subtle — it's the footer) ----
    gsap.utils.toArray(".site-footer [data-reveal]").forEach((col, i) => {
      gsap.fromTo(
        col,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: i * 0.05,
          scrollTrigger: { trigger: col, start: "top 95%", once: true },
        }
      );
    });

    // ---- Stat counters — count up from 0 when in view ----
    document.querySelectorAll(".details__stat dt").forEach((dt) => {
      const original = dt.textContent.trim();
      const match = original.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) return;
      const endVal = parseFloat(match[1]);
      const suffix = match[2] || "";
      const isFloat = match[1].includes(".");
      if (isFloat && endVal < 10) return;

      const obj = { val: 0 };
      gsap.to(obj, {
        val: endVal,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: { trigger: dt, start: "top 85%", once: true },
        onUpdate: () => {
          const small = dt.querySelector("small");
          dt.textContent = (isFloat ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix;
          if (small) dt.appendChild(small);
        },
      });
    });

    // Refresh ScrollTrigger after a tick in case layout shifted (fonts, images)
    gsap.delayedCall(0.2, () => window.ScrollTrigger.refresh());
  }

  // ---- Page loader: hold the curtain for a minimum time, then reveal
  //      the page and the entrance animations together. Nothing above
  //      should ever animate while the loader is still covering it —
  //      runAnimations() is only ever called from inside revealPage().
  //      Multiple redundant triggers + a hard timeout make sure the
  //      overlay can never get stuck covering the page permanently. ----
  const MIN_LOADER_MS = 3000;
  const HARD_FALLBACK_MS = 8000;
  const pageLoader = document.getElementById("page-loader");
  let revealed = false;

  function revealPage() {
    if (revealed) return;
    revealed = true;
    const elapsed = window.performance && performance.now ? performance.now() : MIN_LOADER_MS;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    window.setTimeout(() => {
      runAnimations();
      if (pageLoader) {
        pageLoader.classList.add("is-hidden");
        pageLoader.addEventListener("transitionend", () => pageLoader.remove(), { once: true });
      }
      document.body.classList.remove("is-loading");
    }, wait);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(revealPage);
  }
  window.addEventListener("load", revealPage);
  window.setTimeout(revealPage, HARD_FALLBACK_MS); // safety net


  /* -----------------------------------------------------
     8) Form UX: clear invalid state on input
     ----------------------------------------------------- */
  document.querySelectorAll(".register__form .form-input").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.validity && !input.validity.valid) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    });
  });

  /* -----------------------------------------------------
     9) Footer utilities
     ----------------------------------------------------- */
  // Auto-set the current year
  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Back-to-top: smooth scroll
  document.querySelectorAll("[data-back-to-top]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* -----------------------------------------------------
     10) Scroll progress bar
     ----------------------------------------------------- */
  const progressBar = document.querySelector("[data-scroll-progress]");
  if (progressBar) {
    let pTicking = false;
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = `scaleX(${progress})`;
      pTicking = false;
    };
    window.addEventListener("scroll", () => {
      if (!pTicking) {
        requestAnimationFrame(updateProgress);
        pTicking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  /* -----------------------------------------------------
     11) FAQ accordion — animate the answer height smoothly
     ----------------------------------------------------- */
  const faqItems = document.querySelectorAll(".faq-item");
  if (window.gsap && faqItems.length) {
    // Set initial state of the answer (closed) so we can animate it
    faqItems.forEach((item) => {
      const answer = item.querySelector(".faq-item__answer");
      if (!answer) return;
      // Ensure [open] is removed on first run; details handles its own state
      answer.style.overflow = "hidden";
    });

    faqItems.forEach((item) => {
      const answer = item.querySelector(".faq-item__answer");
      if (!answer) return;
      const summary = item.querySelector(".faq-item__summary");
      if (!summary) return;

      // Close any open item when another opens (single-open behavior)
      summary.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = item.hasAttribute("open");
        // Close all others
        faqItems.forEach((other) => {
          if (other !== item && other.hasAttribute("open")) {
            const otherAnswer = other.querySelector(".faq-item__answer");
            if (otherAnswer) {
              window.gsap.to(otherAnswer, {
                height: 0,
                duration: 0.35,
                ease: "power2.inOut",
                onComplete: () => {
                  other.removeAttribute("open");
                  otherAnswer.style.height = "";
                },
              });
            }
          }
        });

        if (isOpen) {
          // Close this one
          window.gsap.to(answer, {
            height: 0,
            duration: 0.35,
            ease: "power2.inOut",
            onComplete: () => {
              item.removeAttribute("open");
              answer.style.height = "";
            },
          });
        } else {
          // Open this one
          item.setAttribute("open", "");
          const targetHeight = answer.scrollHeight;
          window.gsap.fromTo(
            answer,
            { height: 0 },
            { height: targetHeight, duration: 0.45, ease: "power3.out",
              onComplete: () => { answer.style.height = ""; } }
          );
        }
      });
    });
  }
})();
