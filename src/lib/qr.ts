/**
 * QR helpers — encode/decode payload format used by Sanda for check-in codes.
 * Payload: { jobId, timestamp, secret, signature? }
 */

export interface QRPayload {
  jobId: string;
  timestamp: number;
  secret: string;
  signature?: string;
}

const APP_SECRET = "sanda-secret";

/** Encode a check-in payload to a JSON string. */
export function encodeQRPayload(jobId: string, secret = APP_SECRET): string {
  const payload: QRPayload = {
    jobId,
    timestamp: Date.now(),
    secret,
  };
  return JSON.stringify(payload);
}

/** Parse and validate a QR payload string. Returns null on failure. */
export function decodeQRPayload(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<QRPayload>;
    if (
      typeof parsed.jobId !== "string" ||
      typeof parsed.timestamp !== "number" ||
      typeof parsed.secret !== "string"
    ) {
      return null;
    }
    if (parsed.secret !== APP_SECRET) {
      return null;
    }
    // Reject codes older than 24h
    const ageMs = Date.now() - parsed.timestamp;
    if (ageMs > 24 * 60 * 60 * 1000) return null;
    return parsed as QRPayload;
  } catch {
    return null;
  }
}

/** Build a remote image URL for a given payload (used when no local QR lib is loaded). */
export function qrImageUrl(payload: string, size = 256): string {
  const data = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

/** Convenience: encode + return image URL in one call. */
export function generateQRImage(jobId: string, size = 256): { url: string; payload: string } {
  const payload = encodeQRPayload(jobId);
  return { url: qrImageUrl(payload, size), payload };
}
