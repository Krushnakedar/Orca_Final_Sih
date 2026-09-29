# ORCA Platform — Production SaaS UI/UX + SEO Transformation
## Phase 1: Structured Implementation Plan

**Target**: Full Production SaaS UI/UX + Class-Based Dark/Light Theme System + SEO Engine  
**Status**: Ready for User Review & Approval (No Code Changes Applied Yet)  
**Verification Command**: `npm --prefix frontend run test && npm --prefix frontend run build`  

---

### 1. Design System Architecture & Semantic Tokens

To eliminate all hard-coded hex colors (`#030712`, `#f8fafc`) and scattered dark utility classes (`bg-slate-950`, `border-slate-800`), we introduce a centralized semantic design token system. Tokens are declared as CSS custom properties in `frontend/src/index.css` and exposed directly to Tailwind CSS in `frontend/tailwind.config.js`.

#### Semantic Design Tokens Specification

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* LIGHT MODE (User-Selectable) */
  --background: #f8fafc;            /* Slate 50 */
  --foreground: #0f172a;            /* Slate 900 */
  --surface: #ffffff;               /* Pure White */
  --surface-secondary: #f1f5f9;     /* Slate 100 */
  --surface-tertiary: #e2e8f0;      /* Slate 200 */
  --border: #e2e8f0;                /* Slate 200 */
  --border-subtle: #cbd5e1;         /* Slate 300 */
  --muted: #f1f5f9;                 /* Slate 100 */
  --muted-foreground: #64748b;      /* Slate 500 */
  --primary: #0284c7;               /* Ocean Blue 600 */
  --primary-foreground: #ffffff;    /* White */
  --primary-hover: #0369a1;         /* Ocean Blue 700 */
  --secondary: #0f172a;             /* Deep Slate */
  --secondary-foreground: #ffffff;  /* White */
  --accent: #0d9488;                /* Teal Accent 600 */
  --accent-foreground: #ffffff;     /* White */
  --success: #059669;               /* Emerald 600 */
  --success-foreground: #ffffff;    /* White */
  --success-surface: #ecfdf5;       /* Emerald 50 */
  --warning: #d97706;               /* Amber 600 */
  --warning-foreground: #ffffff;    /* White */
  --warning-surface: #fffbeb;       /* Amber 50 */
  --danger: #e11d48;                /* Rose 600 */
  --danger-foreground: #ffffff;     /* White */
  --danger-surface: #fff1f2;        /* Rose 50 */
  --info: #0284c7;                  /* Sky Blue 600 */
  --info-foreground: #ffffff;       /* White */
  --info-surface: #f0f9ff;          /* Sky 50 */
  --ring: #0284c7;                  /* Ocean 600 focus ring */
  color-scheme: light;
}

.dark {
  /* DARK MODE (Default System State) */
  --background: #030712;            /* Slate 950 Deep Space */
  --foreground: #f8fafc;            /* Slate 50 */
  --surface: #0b1329;               /* Deep Oceanic Slate */
  --surface-secondary: #111e38;     /* Surface Elevation 1 */
  --surface-tertiary: #1e293b;      /* Slate 800 */
  --border: #1e293b;                /* Slate 800 */
  --border-subtle: #334155;         /* Slate 700 */
  --muted: #1e293b;                 /* Slate 800 */
  --muted-foreground: #94a3b8;      /* Slate 400 */
  --primary: #0284c7;               /* Ocean 600 */
  --primary-foreground: #ffffff;    /* White */
  --primary-hover: #38bdf8;         /* Ocean 400 */
  --secondary: #f8fafc;             /* Slate 50 */
  --secondary-foreground: #0f172a;  /* Slate 900 */
  --accent: #14b8a6;                /* Teal Accent 500 */
  --accent-foreground: #030712;     /* Dark Slate 950 */
  --success: #10b981;               /* Emerald 500 */
  --success-foreground: #ffffff;    /* White */
  --success-surface: #064e3b;       /* Emerald 900 */
  --warning: #f59e0b;               /* Amber 500 */
  --warning-foreground: #ffffff;    /* White */
  --warning-surface: #451a03;       /* Amber 950 */
  --danger: #f43f5e;                /* Rose 500 */
  --danger-foreground: #ffffff;     /* White */
  --danger-surface: #4c0519;        /* Rose 950 */
  --info: #38bdf8;                  /* Sky 400 */
  --info-foreground: #030712;       /* Slate 950 */
  --info-surface: #082f49;          /* Sky 950 */
  --ring: #38bdf8;                  /* Cyan Focus Ring */
  color-scheme: dark;
}
```

#### Tailwind Configuration Mapping

In `frontend/tailwind.config.js`:
- Activate `darkMode: 'class'`.
- Map Tailwind colors to the CSS variables:
  - `bg-background` -> `var(--background)`
  - `text-foreground` -> `var(--foreground)`
  - `bg-surface` -> `var(--surface)`
  - `bg-surface-secondary` -> `var(--surface-secondary)`
  - `border-border` -> `var(--border)`
  - `text-muted-foreground` -> `var(--muted-foreground)`
  - `bg-primary`, `bg-accent`, `bg-success`, `bg-warning`, `bg-danger`, `bg-info`
  - Retain backwards-compatible color definitions (`navy`, `ocean`, `tealAccent`) to prevent any existing feature regressions.

---

### 2. Theme System Approach

1. **Class-Based Dark Mode**:
   - The root `<html>` element will carry `class="dark"` for dark mode and `class=""` for light mode.
   - **No global `filter: invert()`**: Zero CSS inversion filters will be used. Colors adapt purely through CSS variable token replacement.
2. **Default & User Selectability**:
   - **Dark mode is the default** for all first-time visitors, preserving the maritime mission-control aesthetic.
   - Users can toggle between Dark and Light mode via an interactive `ThemeToggle` button placed in the top navigation header and footer.
3. **Persistence & FOUC Prevention**:
   - The selected theme is stored in `localStorage` under the key `orca_theme`.
   - An inline script in `frontend/index.html` inside the `<head>` reads `localStorage.getItem('orca_theme')` and immediately applies `dark` class before the first render, preventing any flash of unstyled content (FOUC).
4. **Theme Provider & Hook**:
   - Create `frontend/src/context/ThemeContext.jsx` exposing:
     `{ theme: 'dark' | 'light', isDark: boolean, toggleTheme: () => void, setTheme: (mode) => void }`.
   - Provide custom hook `useTheme()`.

---

### 3. Layout Architecture & Routing Enhancement

Currently, `MainLayout` wraps every page—including public marketing and login routes—forcing the authenticated operational sidebar onto public visitors.

#### Adaptive Layout Engine
We will restructure `MainLayout.jsx` into an adaptive shell supporting three distinct modes:
1. **Marketing Layout (`/`)**:
   - Dedicated `PublicNavbar` with product features navigation, architecture link, live demo access button, operator login link, and `ThemeToggle`.
   - Full-width hero, feature grids, live telemetry highlights, interactive GIS preview, and comprehensive `Footer`.
   - No operator sidebar cluttering the visitor experience.
2. **Auth Layout (`/login`, `/register`)**:
   - Clean, centered card presentation with ORCA oceanic branding, demo autofill pill, and security assurances.
   - No sidebar.
3. **Operational Cockpit Layout (`/dashboard`, `/map`, `/routes`, `/alerts`, `/pfz`, `/chat`, `/history`, `/profile`, `/sources`)**:
   - Top `Header` with system heartbeat, alert notification bell, language selector, `ThemeToggle`, and operator profile.
   - Collapsible, responsive `Sidebar` with route status dots and active indicators.
   - Offline banner, outbox sync drawer, and main content viewport.

#### Route Code-Splitting & Performance
In `frontend/src/App.jsx`, implement `React.lazy()` with `Suspense` and `LoadingSpinner` for each page route. This breaks the single 652 kB monolithic bundle into optimized asynchronous chunks, dramatically improving initial page load time and Lighthouse scores.

---

### 4. Production SaaS Landing Page (`HomePage.jsx`)

Transform the internal prototype checklist into an enterprise SaaS landing page:
1. **Hero Section**:
   - Eye-catching badge: *"Next-Gen Marine Intelligence • Smart India Hackathon 2026"*.
   - Headline: *"Autonomous Multi-Agent Intelligence for Maritime Safety & Navigation"*.
   - Value Proposition: Highlighting real-time satellite correlation (INCOIS, IMD, Sentinel-3), deterministic risk calculation, and zero-connectivity offline capability.
   - Primary Actions: *"Launch Command Center"* (direct to `/dashboard`) and *"Try Interactive Demo"* (autofills credentials).
2. **Live Operational Telemetry Ticker**:
   - Real-time sector status across 5 Indian coastal regions (Mumbai, Kochi, Chennai, Visakhapatnam, Porbandar).
3. **Core Capability Matrix (6 Pillars)**:
   - **Deterministic Risk Engine**: Physical oceanographic rules evaluate risk scores (0-100); AI models explain reasoning with cited evidence.
   - **Safe Waterway Route Optimization**: A* sea-lane navigation avoiding 100% of landmasses, shallow reefs, and naval firing zones.
   - **Satellite PFZ Intelligence**: Chlorophyll blooms and thermal front detection predicting high pelagic fish concentration.
   - **Emergency Operations Center**: High-priority alert broadcasting synchronized with VHF Channel 16 protocols.
   - **Agentic Multi-Agent Orchestrator**: Natural language domain agents decomposing marine inquiries into structured tasks.
   - **Offline-First PWA Architecture**: Background IndexedDB caching and mutation queue ensuring complete operational readiness at sea.
4. **Interactive Architecture & Decoupling Showcase**:
   - Interactive preview of the 4-layer provider pipeline and live data provenance indicators.
5. **Interactive Marine Cockpit Teaser**:
   - High-fidelity preview card showcasing live telemetry, wave swells, and geofence monitoring.
6. **Sector Coverage & Operator Use Cases**:
   - Tailored workflows for Traditional Artisanal Fishermen, Commercial Fleets, Indian Coast Guard, and Marine Researchers.
7. **Production SaaS Footer (`layouts/Footer.jsx`)**:
   - Structured columns: Solutions, Technology, Data Sources (INCOIS / IMD / Copernicus), Regulatory Compliance (UNCLOS / DG Shipping), System Status, and Theme Switcher.

---

### 5. SEO & Discoverability Engine

1. **HTML Document Meta Optimization (`index.html`)**:
   - Semantic title: `ORCA — Agentic AI Marine Intelligence & Maritime Safety Platform`.
   - Comprehensive meta tags: description, keywords, author, robots, theme-color (`#030712` / `#0284c7`).
   - Open Graph tags (`og:title`, `og:description`, `og:type`, `og:image`, `og:url`, `og:site_name`).
   - Twitter Cards (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
   - Pre-paint theme inline script preventing FOUC.
2. **Dynamic Route Head Component (`SEOHead.jsx`)**:
   - Reusable component managing dynamic document `<title>`, meta description, canonical link, and Open Graph tags per route.
3. **Search Engine Crawling Directives (`frontend/public/robots.txt`)**:
   - Allow indexing of public marketing and auth pages (`/`, `/login`, `/register`).
   - Disallow private operator cockpits (`/dashboard`, `/chat`, `/map`, `/routes`, etc.) to protect operational telemetry.
   - Reference `sitemap.xml`.
4. **XML Sitemap (`frontend/public/sitemap.xml`)**:
   - Valid XML sitemap indexing all public entry points with `<changefreq>` and `<priority>`.
5. **Structured Data JSON-LD (`index.html` / `SEOHead.jsx`)**:
   - Schema.org `SoftwareApplication` with `operatingSystem: "Web, PWA"`, `applicationCategory: "MaritimeIntelligence"`, `offers`, and `author: "ORCA Marine Intelligence"`.

---

### 6. Files to be Created

| New File Path | Type | Responsibility |
| :--- | :--- | :--- |
| `frontend/src/context/ThemeContext.jsx` | React Context | Class-based dark mode state, `localStorage` persistence (`orca_theme`), `useTheme()` hook. |
| `frontend/src/components/ThemeToggle.jsx` | UI Component | Accessible Sun/Moon theme switcher button with smooth transition. |
| `frontend/src/components/SEOHead.jsx` | Utility Component | Dynamic document title, canonical link, and meta description injector. |
| `frontend/src/components/common/Button.jsx` | Design System | Reusable semantic button supporting variants (`primary`, `secondary`, `outline`, `ghost`, `danger`). |
| `frontend/src/components/common/Card.jsx` | Design System | Reusable card container using `bg-surface`, `border-border`, with header and content slots. |
| `frontend/src/components/common/Badge.jsx` | Design System | Semantic status badge supporting `success`, `warning`, `danger`, `info`, `neutral`. |
| `frontend/src/components/common/Container.jsx` | Design System | Standardized responsive content container (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`). |
| `frontend/src/layouts/PublicNavbar.jsx` | Layout Component | Clean marketing navbar with brand, navigation links, theme toggle, and Sign In button. |
| `frontend/src/layouts/Footer.jsx` | Layout Component | Comprehensive SaaS footer with product pillars, data source credits, and status indicator. |
| `frontend/public/robots.txt` | SEO Asset | Web crawler indexing rules and sitemap declaration. |
| `frontend/public/sitemap.xml` | SEO Asset | Search engine XML sitemap of all public routes. |

---

### 7. Files to be Modified

| Existing File Path | Modification Plan |
| :--- | :--- |
| `frontend/tailwind.config.js` | Enable `darkMode: 'class'`; map semantic color tokens (`background`, `foreground`, `surface`, `border`, `muted`, `primary`, `accent`, `success`, `warning`, `danger`, `info`). |
| `frontend/src/index.css` | Define `:root` (light) and `.dark` (dark) CSS variable token values; update `.map-tiles-dark` filter to respect dark mode without breaking map visibility. |
| `frontend/index.html` | Insert pre-paint theme script; add complete meta tags (description, OG, Twitter); embed JSON-LD structured data; configure theme-color. |
| `frontend/src/App.jsx` | Wrap tree in `ThemeProvider`; implement `React.lazy()` + `Suspense` for all pages; add `/sources` route for `DataSourcesPage`. |
| `frontend/src/layouts/MainLayout.jsx` | Convert to adaptive layout: display marketing navbar and footer for `/`, clean auth shell for `/login` & `/register`, full operational sidebar + header for protected pages. |
| `frontend/src/layouts/Header.jsx` | Replace hardcoded slate classes with semantic tokens (`bg-surface/80`, `border-border`, `text-foreground`); add `ThemeToggle`. |
| `frontend/src/layouts/Sidebar.jsx` | Apply semantic tokens (`bg-surface`, `border-border`); add navigation link for `DataSourcesPage` (`/sources`); refine active link states. |
| `frontend/src/pages/HomePage.jsx` | Rebuild as a world-class production SaaS landing page with hero, live telemetry ticker, feature matrix, architecture pipeline, and onboarding CTAs. |
| `frontend/src/pages/DashboardPage.jsx` | Update telemetry cards, risk score display, and grid layout to consume semantic tokens, maintaining full offline-first resilience. |
| `frontend/src/pages/MapPage.jsx` | Update surrounding control headers, accordion selectors, and weather-safety inspection cards with semantic tokens while leaving map canvas intact. |
| `frontend/src/pages/RoutesPage.jsx` | Update route planner container, mobile tab switcher, and baseline comparison controls with semantic tokens. |
| `frontend/src/pages/AlertsPage.jsx` | Update alert broadcast cards and emergency distress frequency panels with semantic tokens. |
| `frontend/src/pages/PFZPage.jsx` | Update pelagic zone carousel, sector tabs, and species cards with semantic tokens. |
| `frontend/src/pages/ChatPage.jsx` | Update chat container, suggestion chips, and decision hierarchy cards with semantic tokens. |
| `frontend/src/pages/HistoryPage.jsx` | Update audit trail search bar, trace cards, and filter controls with semantic tokens. |
| `frontend/src/pages/ProfilePage.jsx` | Modernize operator credential cards and vessel specifications with semantic tokens. |
| `frontend/src/pages/LoginPage.jsx` | Update auth form container and input fields with semantic tokens (preserving demo auto-fill and auth logic). |
| `frontend/src/pages/RegisterPage.jsx` | Update registration form inputs and role selectors with semantic tokens (preserving register logic). |
| `frontend/src/pages/NotFoundPage.jsx` | Update 404 card styling with semantic tokens. |
| `frontend/src/pages/DataSourcesPage.jsx` | Re-activate page: adopt semantic tokens for provider decoupling schematic and query sandbox. |
| `frontend/src/features/map/MarineMap.jsx` | Update only the outer wrapper container and the floating legend/symbol guide with semantic tokens (`bg-surface/95`, `border-border`). **Preserve 100% of Leaflet layers, markers, polylines, coordinates, and WMS integrations**. |

---

### 8. Files to be Left Strictly Untouched (Backend & Core Protected)

Under the strict constraints of this assignment, the following files and directories will **NOT be modified**:
1. **Entire `backend/` directory**:
   - `backend/server.js`, `backend/src/**/*` (controllers, routes, middleware, models, services).
   - No changes to API routes, payload formats, database schemas, or rate limiters.
   - All backend test files (`test_master.js`, `check-astar-route.js`, etc.).
2. **Authentication Core Logic**:
   - `frontend/src/context/AuthContext.jsx` (JWT token handling, session persistence, cached snapshot logic).
   - `frontend/src/services/authService.js`.
3. **Marine Calculation & Geospatial Engines**:
   - `frontend/src/utils/marineReadings.js` (reading extraction, swell substitution heuristics).
   - `frontend/src/utils/routeAvailability.js`.
4. **Offline Synchronization Infrastructure**:
   - `frontend/src/offline/syncPolicy.js`
   - `frontend/src/offline/outbox.js`
   - `frontend/src/offline/syncDb.js`
   - `frontend/src/offline/syncEngine.js`
   - `frontend/src/offline/idempotency.js`
5. **Leaflet Core Geometries & Interactions**:
   - Map coordinate systems, GeoJSON layer parsing, A* waypoint polylines, live GPS radar beacon markers, and INCOIS WMS layers.

---

### 9. Verification & Quality Assurance Strategy

After each phase of changes, the following exact verification command will be executed:

```bash
npm --prefix frontend run test && npm --prefix frontend run build
```

This guarantees:
1. All 20 offline policy and marine readings tests pass (`vitest`).
2. Vite builds the entire production application with zero syntax errors, broken imports, or missing dependencies.
3. Code splitting succeeds and bundle sizes remain optimized.

---

### Plan Approval Request

This concludes Phase 1. As stipulated in the critical workflow instructions:  
**No source code has been modified.**  

Please review this implementation plan and provide your approval to begin **Phase 2 — Execution**.
