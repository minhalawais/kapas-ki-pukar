import type { Location as ComplaintLocation } from "@kapas/domain";
import * as ExpoLocation from "expo-location";

export type LocationCaptureResult =
  | { status: "granted"; location: Partial<ComplaintLocation> }
  | { status: "denied" }
  | { status: "error" };

function formatAddress(address?: ExpoLocation.LocationGeocodedAddress): string | undefined {
  if (!address) return undefined;
  return [address.name, address.street, address.district, address.city, address.region]
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(", ");
}

export const expoLocationService = {
  async captureCurrent(): Promise<LocationCaptureResult> {
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status !== ExpoLocation.PermissionStatus.GRANTED) {
        return { status: "denied" };
      }
      const position = await Promise.race([
        ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("location-timeout")), 12_000);
        }),
      ]);
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      let address: ExpoLocation.LocationGeocodedAddress | undefined;
      try {
        address = (await ExpoLocation.reverseGeocodeAsync(coordinates))[0];
      } catch {
        // Coordinates remain useful when reverse geocoding is unavailable offline.
      }
      const coordinateLabel = `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
      return {
        status: "granted",
        location: {
          province: address?.region ?? "GPS location",
          district: address?.city ?? address?.district ?? address?.subregion ?? "GPS location",
          placeLabel: address?.name ?? address?.street ?? address?.district ?? address?.city ?? "Location pin",
          villageLabel: address?.name ?? address?.district ?? address?.city ?? undefined,
          formattedAddress: formatAddress(address) ?? coordinateLabel,
          source: "device",
          accuracyMeters: position.coords.accuracy ?? undefined,
          exactCoordinates: coordinates,
        },
      };
    } catch {
      return { status: "error" };
    }
  },
};
