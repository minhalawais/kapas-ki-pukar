import type { GeoCoordinates } from "@kapas/domain";

const EMBED_DELTA = 0.008;

export function googleMapsSearchUrl({ latitude, longitude }: GeoCoordinates): string {
  const query = `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function openStreetMapEmbedUrl({ latitude, longitude }: GeoCoordinates): string {
  const west = longitude - EMBED_DELTA;
  const east = longitude + EMBED_DELTA;
  const south = latitude - EMBED_DELTA;
  const north = latitude + EMBED_DELTA;
  const bbox = `${west},${south},${east},${north}`;
  const marker = `${latitude}%2C${longitude}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}

export function formatCoordinates({ latitude, longitude }: GeoCoordinates): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
