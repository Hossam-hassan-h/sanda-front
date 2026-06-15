export type CameraPermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return "unavailable";
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    if (videoDevices.length === 0) return "unavailable";
    if (typeof navigator.permissions?.query === "function") {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      if (result.state === "denied") return "denied";
      if (result.state === "prompt") return "prompt";
      if (result.state === "granted") return "granted";
    }
    return "prompt";
  } catch {
    return "unavailable";
  }
}

export function isSecureContext(): boolean {
  return window.isSecureContext || location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

export function supportsTorch(): boolean {
  return "ImageCapture" in window && typeof (window as unknown as Record<string, unknown>).ImageCapture === "function";
}

export async function getCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  } catch {
    return [];
  }
}
