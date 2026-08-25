"use client";

import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface NearbyPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MiniMapProps {
  latitude: number;
  longitude: number;
  nearbyPlaces: NearbyPlace[];
  onPlaceClick?: (place: NearbyPlace) => void;
}

export function MiniMap({
  latitude,
  longitude,
  nearbyPlaces,
  onPlaceClick,
}: MiniMapProps) {
  return (
    <div className="w-full h-full">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://demotiles.maplibre.org/style"
        dragRotate={false}
        scrollZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg" />
        </Marker>

        {nearbyPlaces.map((place) => (
          <Marker
            key={place.id}
            longitude={place.longitude}
            latitude={place.latitude}
            anchor="center"
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 shadow-sm cursor-pointer"
              onClick={() => onPlaceClick?.(place)}
            >
              {place.name.charAt(0).toUpperCase()}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
