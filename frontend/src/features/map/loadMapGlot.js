// Loads the MapGlot SDK (a thin wrapper over MapLibre GL JS) from MapGlot's
// vendor CDN, exactly per the documented quick start at https://mapglot.com/docs
// ("0. MapGlot.js SDK"). We use the script-tag SDK rather than an npm package
// so no additional mapping-library dependency is added to the project
// (dependency discipline) — this also matches MapGlot's own recommended
// integration path.
//
// Resolves to `window.MapGlot`. `window.maplibregl` (the real MapLibre GL JS
// instance MapGlot is built on) is also left on the page for layers/sources
// MapGlot's helper API doesn't cover directly (WMS raster sources, custom
// marker elements, etc.) — `MapGlot.map()` returns the live MapLibre map
// object, so mixing raw MapLibre calls with MapGlot helpers is supported.

const MAPLIBRE_CSS_URL = "https://mapglot.com/vendor/maplibre-gl.css";
const MAPLIBRE_JS_URL = "https://mapglot.com/vendor/maplibre-gl.js";
const MAPGLOT_JS_URL = "https://mapglot.com/mapglot.js";

let loadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Failed to load ${src}`))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Idempotent loader — safe to call from every <MarineMap /> mount. Returns a
 * cached promise so the scripts are only fetched once per page load.
 */
export function loadMapGlot() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    loadStylesheet(MAPLIBRE_CSS_URL);
    await loadScript(MAPLIBRE_JS_URL);
    await loadScript(MAPGLOT_JS_URL);
    if (!window.MapGlot || !window.maplibregl) {
      throw new Error(
        "MapGlot SDK failed to initialize (window.MapGlot / window.maplibregl missing)."
      );
    }
    return window.MapGlot;
  })().catch((err) => {
    // Allow a retry on the next mount instead of caching a permanent failure.
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}
