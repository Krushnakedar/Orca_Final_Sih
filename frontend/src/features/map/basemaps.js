// Shared basemap configuration for the maps that use the light INCOIS/Samudra-style
// geographic look (Dashboard + Marine Map page). Other maps keep their existing basemaps.
//
// Esri "World Topographic Map" classic raster tiles: cream land, blue ocean,
// coastlines, state/country boundaries and city labels are all baked into the tiles
// (no CSS filter is used to achieve the look). No API key is required.
//
// NOTE: Esri has marked this classic tile service as deprecated (no longer updated,
// may be retired without notice). If it is ever switched off, replace this one entry
// with the ArcGIS Basemap Styles service ("arcgis/topographic"), which needs an
// ArcGIS API key supplied through an env variable such as VITE_ARCGIS_API_KEY.

export const MARINE_LIGHT_BASEMAP = {
  name: "Marine Light (Esri Topo)",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  maxZoom: 19,
  attribution:
    'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
};

// Placeholder colour shown behind tiles while they load (light, not black).
export const MARINE_LIGHT_BACKGROUND = "#c9dde8";
