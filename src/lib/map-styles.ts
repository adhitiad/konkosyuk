export const MAP_STYLES = {
  MAPTILER_STREETS: `https://api.maptiler.com/maps/streets-v4/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
  MAPTILER_SATELLITE: `https://api.maptiler.com/maps/hybrid/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
  CARTODB_VOYAGER:
    "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  CARTODB_POSITRON:
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};
