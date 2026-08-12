import { MAP_STYLES } from "./map-styles";

export const MAP_CONFIG = {
  initialViewState: {
    longitude: 118,
    latitude: -2,
    zoom: 4,
  },
  mapStyle: MAP_STYLES.MAPTILER_STREETS,
  fallbackMapStyle: MAP_STYLES.CARTODB_VOYAGER,
  maxZoom: 18,
  minZoom: 3,
};
