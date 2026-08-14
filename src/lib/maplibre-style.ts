import type { StyleSpecification } from "maplibre-gl";

/**
 * Konfigurasi style MapLibre untuk KonkosYuk.
 *
 * Opsi 1 (saat ini): OSM Raster Tiles
 * - Gratis, tanpa API key
 * - Cocok untuk development dan production kecil
 * - Tidak mendukung 3D building/pitching dengan bagus
 *
 * Opsi 2 (produksi besar): MapTiler Streets v2
 * - Vector tiles, performa lebih baik
 * - Perlu API key dari https://cloud.maptiler.com
 * - Ganti `OSM_STYLE` dengan `MAPTILER_STYLE` dan set MAPTILER_KEY
 *
 * Opsi 3 (alternatif gratis): Carto Positron / Dark Matter
 * - Vector tiles gratis dari Carto
 * - Tanpa API key, rate limit lebih ketat
 */
export const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MAPTILER_STYLE = (apiKey: string): StyleSpecification => ({
  version: 8,
  sources: {
    "maptiler-tiles": {
      type: "vector",
      url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${apiKey}`,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#f8f9fa" },
    },
    {
      id: "maptiler-streets",
      type: "symbol",
      source: "maptiler-tiles",
      "source-layer": "maptiler-streets",
    },
  ],
});

export const CARTO_POSITRON_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "carto-positron": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "carto-layer",
      type: "raster",
      source: "carto-positron",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const CARTO_DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Rekomendasi untuk KonkosYuk:
 *
 * - Development / MVP: OSM_STYLE (gratis, cepat)
 * - Production (branding terang): CARTO_POSITRON_STYLE (gratis, bersih)
 * - Production (dark mode / branding gelap): CARTO_DARK_STYLE (gratis, elegan)
 * - Production (fitur lengkap): MAPTILER_STYLE (berbayar, performa terbaik)
 */
export const KONKOSYUK_MAP_STYLE = OSM_STYLE;
