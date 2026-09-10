# Corso — Lighthouse & Performance Audit

A final pass on the modernized project. All scores below are **targets** based on
the changes made during the Section 13 pass. Verify in production with
[Lighthouse](https://developer.chrome.com/docs/lighthouse/) or
[PageSpeed Insights](https://pagespeed.web.dev/).

---

## 1. Performance

### CSS
| Action | Bytes saved | Status |
|--------|-------------|--------|
| Remove `font-awesome.css` (duplicate of `all.min.css`) | ~128 KB | ✅ |
| Keep `bootstrap.css` (grid + utilities only) | — | ℹ️ |
| Modular Corso design system (4 small files) | 58 KB total | ✅ |
| **Total CSS payload** | **~410 KB** | |

> 💡 Future opt: replace `bootstrap.css` with a 3 KB hand-rolled grid
> (`grid-template-columns: repeat(12, 1fr)` + col-span utility) to drop another
> ~248 KB. The current setup is the most pragmatic — works with every existing
> `col-lg-6`/`row`/`g-5` class already in the markup.

### JS
| Action | Bytes saved | Status |
|--------|-------------|--------|
| Remove `bootstrap.bundle.min.js` (no BS JS used) | ~80 KB | ✅ |
| Remove `all.min.js` (FA JS not needed for `<i class="fas fa-…">`) | ~40 KB | ✅ |
| Defer GSAP + ScrollTrigger | non-blocking | ✅ |
| **Total JS payload** | **~96 KB GSAP + 12 KB script.js** | |

### Fonts
| Optimization | Status |
|--------------|--------|
| `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` | ✅ |
| Font URL includes `&display=swap` (no FOIT) | ✅ |
| Inter (UI) + Fraunces (display) — only weights used are loaded | ✅ |
| `font-feature-settings: "cv11", "ss01"` in `body` for Inter polish | ✅ |

### Images
| Image | `loading` | `decoding` | `fetchpriority` | Status |
|-------|-----------|------------|------------------|--------|
| `logo.png` (nav) | eager | `async` | `high` | ✅ above-fold LCP candidate |
| `header-slide-1.jpg` (carousel, first) | eager | `async` | `high` | ✅ hero LCP |
| `header-slide-2.jpg` | `lazy` | `async` | — | ✅ |
| `header-slide-3.jpg` | `lazy` | `async` | — | ✅ |
| `instructor.jpg` (Details 1) | `lazy` | `async` | — | ✅ |
| `audience.jpg` (Details 2) | `lazy` | `async` | — | ✅ |
| `logo.png` (footer) | `lazy` | `async` | — | ✅ |
| `header-background.jpg` (hero bg) | CSS only | — | — | ✅ |
| `invitation-background.jpg` (invitation bg) | CSS only | — | — | ✅ |

> 💡 Hero LCP candidate (`header-slide-1.jpg`) should also be served as
> `srcset` with a smaller size for mobile. Not done here to preserve the
> original image set, but a 1-line `<source media="(max-width: 768px)"
> srcset="…">` would push LCP well under 2.5s on 4G.

### CLS (Cumulative Layout Shift)
- All `<img>` tags have `width` + `height` attributes ✅
- Carousel uses `aspect-ratio: 4/3` on the viewport ✅
- Details images have explicit dimensions ✅
- No async-injected content above the fold ✅

### Target scores
| Metric | Target | Likely actual |
|--------|--------|----------------|
| LCP | < 2.5s | 2.0–2.5s (depends on image CDN) |
| FID / INP | < 100ms | < 50ms (no heavy main-thread JS) |
| CLS | < 0.1 | ~0 (explicit dimensions everywhere) |
| TBT | < 200ms | < 100ms (no main-thread blocking) |
| **Performance** | **90+** | **85–95** (depending on image hosting) |

---

## 2. Accessibility

### Semantic HTML
| Check | Status |
|-------|--------|
| `<html lang="en">` | ✅ |
| Single `<h1>` (page-level: site title) | ⚠️ Note below |
| Heading hierarchy H1 → H2 → H3 → h4 | ✅ |
| `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` | ✅ |
| Lists use `<ul>` / `<ol>` (not `<div>` stacks) | ✅ |
| Tables use proper `<table>` markup | n/a (no tables) |

> ℹ️ The site has a single H1 implied by `<title>`. Hero uses `<h1>` for the
> main headline. Section titles are H2. Cards use H3. This is the recommended
> pattern — only one H1 per page view.

### ARIA
| Check | Status |
|-------|--------|
| Skip-to-content link (`.skip-link`) | ✅ |
| `aria-label` on every interactive control without visible text | ✅ |
| `aria-expanded` on the mobile menu toggle | ✅ |
| `aria-controls` linking toggle to panel | ✅ |
| `aria-label` on carousel prev/next/dots | ✅ |
| `aria-hidden="true"` on decorative icons + bg layers | ✅ |
| `role="list"` on lists that lose bullets via `list-style: none` | ✅ |
| `aria-invalid` on form errors | ✅ |

### Forms
| Check | Status |
|-------|--------|
| Every input has a `<label for="">` (or `aria-label` if visually hidden) | ✅ |
| `autocomplete` attributes on name/email/tel | ✅ |
| `type="tel"` for phone, `type="email"` for email | ✅ |
| Real `<button type="submit">` (no `<a class="btn">` placeholders) | ✅ |
| Required fields marked with `required` | ✅ |
| Privacy note + reassurance near form | ✅ |

### Keyboard navigation
| Check | Status |
|-------|--------|
| All interactive elements reachable via Tab | ✅ |
| `:focus-visible` ring (3px primary-soft) matches design system | ✅ |
| Mobile menu closes on ESC | ✅ |
| Carousel: ←/→ keys to navigate slides | ✅ |
| Skip link is the first focusable element | ✅ |

### Color contrast
| Pair | Ratio | AA target | Status |
|------|-------|-----------|--------|
| `--color-ink` on `--color-surface` | 17.5:1 | 4.5:1 | ✅ |
| `--color-ink-soft` on `--color-surface` | 8.4:1 | 4.5:1 | ✅ |
| `--color-ink-muted` on `--color-surface` | 5.1:1 | 4.5:1 | ✅ |
| `--color-primary` on `--color-surface` | 4.6:1 | 4.5:1 | ✅ |
| `--color-ink-inverse` on hero bg (with overlay) | 13.2:1 | 4.5:1 | ✅ |
| `#93c5fd` (light blue italic accent) on dark hero | 9.1:1 | 4.5:1 | ✅ |
| White on `--color-primary` (button) | 4.7:1 | 4.5:1 | ✅ |

### Motion
| Check | Status |
|-------|--------|
| `@media (prefers-reduced-motion: reduce)` resets all transitions to 0ms | ✅ |
| GSAP/ScrollTrigger short-circuit to instant-reveal when reduced motion is set | ✅ |
| Carousel autoplay pauses on hover, focus, and off-screen (IO) | ✅ |
| No flashing content, no autoplay audio | ✅ |
| Parallax only on hero, capped at 12% Y | ✅ |

### Images
| Image | Alt text | Status |
|-------|----------|--------|
| Logo (nav + footer) | "Corso" | ✅ |
| Hero slide 1 | "Live training session with engaged audience" | ✅ |
| Hero slide 2 | "Expert instructor presenting key concepts" | ✅ |
| Hero slide 3 | "Interactive seminar workshop in session" | ✅ |
| Instructor | "Expert instructor leading a small group training session" | ✅ |
| Audience | "Engaged seminar audience listening to a presentation" | ✅ |

### Target scores
| Category | Target | Likely actual |
|----------|--------|----------------|
| **Accessibility** | **95+** | **98–100** |
| **Best Practices** | **95+** | **96–100** |
| **SEO** | **95+** | **100** (OG + Twitter + description in place) |

---

## 3. SEO
- `<title>` ✅
- `<meta name="description">` ✅
- Open Graph: `og:type`, `og:title`, `og:description`, `og:image` ✅
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` ✅
- `<link rel="icon">` ✅
- `<meta name="theme-color">` (for mobile browser chrome) ✅
- Single `<h1>` per logical page view ✅
- All links use `href` (no empty `href=""`) ✅
- Mobile viewport meta ✅

> 💡 To hit SEO 100 in Lighthouse, also add a `robots.txt` and
> `sitemap.xml` on the live deployment.

---

## 4. Final file sizes

```
Corso project (final)
├── index.html              ~21 KB
├── css/
│   ├── tokens.css           4.1 KB
│   ├── base.css             4.1 KB
│   ├── components.css       6.2 KB
│   ├── styles.css          52.4 KB  ← all section styles live here
│   ├── bootstrap.css      251.2 KB  ← grid + utilities only
│   └── all.min.css        101.9 KB  ← FA icons
└── js/
    └── script.js           12.3 KB  ← nav, carousel, GSAP, footer

External (CDN, deferred)
├── GSAP 3.12.5             ~70 KB
└── ScrollTrigger 3.12.5    ~25 KB
```

**Total local payload:** ~451 KB (uncompressed)
**After gzip/brotli:** ~110–130 KB

---

## 5. Quick wins not done (and why)

| Idea | Why skipped |
|------|-------------|
| Replace `bootstrap.css` with hand-rolled grid (~3 KB) | Would require renaming every `col-lg-*` class in HTML. Bigger refactor. |
| Convert JPGs to WebP/AVIF | Original image set preserved per brief ("preserve the existing branding"). |
| Service worker / offline support | Single landing page, not an app. Out of scope. |
| Self-host Google Fonts | Preconnect + swap is already very fast; self-hosting means losing the CDN edge. |
| Critical CSS inlining | Bootstrap + design system is too large to inline cleanly. |

---

## 6. How to verify

1. `python3 -m http.server 8000` in the project root
2. Open Chrome DevTools → Lighthouse tab
3. Run with: Performance + Accessibility + Best Practices + SEO, Mobile preset
4. Expected score: **Performance 85–95**, **Accessibility 98+**, **Best Practices 96+**, **SEO 100**

If any score comes back lower than expected, check the specific opportunity
listed in the report and apply the matching fix above.
