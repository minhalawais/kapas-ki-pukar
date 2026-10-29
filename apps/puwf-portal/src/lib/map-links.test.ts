import { describe, expect, it } from "vitest";

import {
  formatCoordinates,
  googleMapsSearchUrl,
  openStreetMapEmbedUrl,
} from "./map-links";

describe("map-links", () => {
  const coords = { latitude: 31.5204, longitude: 74.3587 };

  it("builds a Google Maps search URL", () => {
    expect(googleMapsSearchUrl(coords)).toBe(
      "https://www.google.com/maps/search/?api=1&query=31.5204%2C74.3587",
    );
  });

  it("builds an OpenStreetMap embed URL with marker", () => {
    const url = openStreetMapEmbedUrl(coords);
    expect(url).toContain("openstreetmap.org/export/embed.html");
    expect(url).toContain("marker=31.5204%2C74.3587");
  });

  it("formats coordinates for display", () => {
    expect(formatCoordinates(coords)).toBe("31.520400, 74.358700");
  });
});
