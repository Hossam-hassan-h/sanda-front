export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface GeoError {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED";
  message: string;
}

/** Get the user's current position as a Promise. */
export function getCurrentPosition(options: PositionOptions = {}): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const err: GeoError = {
        code: "UNSUPPORTED",
        message: "Geolocation is not supported in this environment",
      };
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
      (err) => {
        const codeMap: Record<number, GeoError["code"]> = {
          1: "PERMISSION_DENIED",
          2: "POSITION_UNAVAILABLE",
          3: "TIMEOUT",
        };
        reject({
          code: codeMap[err.code] ?? "UNSUPPORTED",
          message: err.message,
        } satisfies GeoError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
        ...options,
      }
    );
  });
}

/** Haversine distance between two points in kilometers. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Format a distance in km to a short Arabic label. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} م`;
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km)} كم`;
}

/** Cairo city center (used as a default if no geolocation is available). */
export const DEFAULT_CENTER: GeoCoordinates = {
  lat: 30.0444,
  lng: 31.2357,
  timestamp: 0,
};
