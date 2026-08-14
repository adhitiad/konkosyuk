export function jitterCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number = 400,
): { lat: number; lng: number } {
  const rLat = radiusMeters / 111320;
  const rLng = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  const randomLat = (Math.random() - 0.5) * 2 * rLat;
  const randomLng = (Math.random() - 0.5) * 2 * rLng;

  return {
    lat: lat + randomLat,
    lng: lng + randomLng,
  };
}
