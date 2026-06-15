import { useRef, useState, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getCameras, isSecureContext } from "@/utils/camera";

export type ScanState = "idle" | "scanning" | "success" | "error" | "locked";

export interface QrScannerError {
  type: "PERMISSION_DENIED" | "NO_CAMERA" | "HTTPS_REQUIRED" | "INIT_FAILURE" | "UNKNOWN";
  message: string;
}

export interface CameraDevice {
  id: string;
  label: string;
}

interface UseQrScannerOptions {
  fps?: number;
  qrboxSize?: number;
  onSuccess?: (decodedText: string) => void;
  onError?: (error: QrScannerError) => void;
}

interface UseQrScannerReturn {
  state: ScanState;
  error: QrScannerError | null;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  start: (deviceId?: string) => Promise<void>;
  stop: () => Promise<void>;
  switchCamera: () => Promise<void>;
  toggleTorch: () => Promise<void>;
  isTorchOn: boolean;
  torchSupported: boolean;
}

export function useQrScanner(options: UseQrScannerOptions = {}): UseQrScannerReturn {
  const { fps = 12, qrboxSize = 280, onSuccess, onError } = options;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<QrScannerError | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const lockedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshDevices = useCallback(async () => {
    const cams = await getCameras();
    const mapped = cams.map((c) => ({ id: c.deviceId, label: c.label || `كاميرا ${cams.indexOf(c) + 1}` }));
    setDevices(mapped);
    if (mapped.length > 0 && !selectedDeviceId) {
      const backCam = mapped.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")) || mapped[0];
      setSelectedDeviceId(backCam.id);
    }
    return mapped;
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const stop = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Scanner may already be stopped by the browser or html5-qrcode internals.
      }
      try {
        await scannerRef.current.clear();
      } catch {
        // Clearing is best-effort during teardown.
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) {
      setState("idle");
      setIsTorchOn(false);
    }
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    if (!isSecureContext()) {
      const err = { type: "HTTPS_REQUIRED" as const, message: "يجب استخدام HTTPS لتشغيل الكاميرا" };
      setError(err);
      setState("error");
      onError?.(err);
      return;
    }

    const cams = await refreshDevices();
    if (cams.length === 0) {
      const err = { type: "NO_CAMERA" as const, message: "لم يتم العثور على كاميرا" };
      setError(err);
      setState("error");
      onError?.(err);
      return;
    }

    const targetDeviceId = deviceId || selectedDeviceId || cams[0].id;
    setSelectedDeviceId(targetDeviceId);

    try {
      const scanner = new Html5Qrcode("sanda-qr-reader");
      scannerRef.current = scanner;
      lockedRef.current = false;

      await scanner.start(
        { deviceId: { exact: targetDeviceId } },
        {
          fps,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.7777778,
        },
        async (decodedText) => {
          if (lockedRef.current || !mountedRef.current) return;
          lockedRef.current = true;
          setState("success");
          try {
            await scanner.pause(true);
          } catch {
            // Some scanner states cannot be paused; the scan result is still valid.
          }
          onSuccess?.(decodedText);
        },
        () => {
          // Frame-level decode failures are expected while scanning.
        }
      );

      if (mountedRef.current) {
        setState("scanning");
        setError(null);
      }

      try {
        const hasTorch = scanner.getTorch();
        setTorchSupported(hasTorch !== null);
      } catch {
        setTorchSupported(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("NotAllowedError") || message.includes("Permission denied")) {
        const e = { type: "PERMISSION_DENIED" as const, message: "يرجى السماح بالوصول للكاميرا في الإعدادات" };
        setError(e);
        setState("error");
        onError?.(e);
      } else {
        const e = { type: "INIT_FAILURE" as const, message: "فشل في تشغيل الكاميرا" };
        setError(e);
        setState("error");
        onError?.(e);
      }
    }
  }, [fps, qrboxSize, selectedDeviceId, onSuccess, onError, refreshDevices]);

  const switchCamera = useCallback(async () => {
    if (devices.length < 2) return;
    await stop();
    const currentIndex = devices.findIndex((d) => d.id === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].id;
    setSelectedDeviceId(nextDeviceId);
    await start(nextDeviceId);
  }, [devices, selectedDeviceId, stop, start]);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const newState = !isTorchOn;
      await scannerRef.current.updateVideoConstraints({});
      const track = await getTorchTrack(scannerRef.current);
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: newState } as unknown as MediaTrackConstraintSet],
        });
      }
      setIsTorchOn(newState);
    } catch {
      // Torch is optional and not consistently exposed by browsers.
    }
  }, [isTorchOn, torchSupported]);

  useEffect(() => {
    return () => {
      lockedRef.current = false;
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => undefined); } catch { /* best-effort teardown */ }
        try { scannerRef.current.clear().catch(() => undefined); } catch { /* best-effort teardown */ }
        scannerRef.current = null;
      }
    };
  }, []);

  return {
    state,
    error,
    devices,
    selectedDeviceId,
    start,
    stop,
    switchCamera,
    toggleTorch,
    isTorchOn,
    torchSupported,
  };
}

async function getTorchTrack(scanner: Html5Qrcode): Promise<MediaStreamTrack | null> {
  try {
    const track = await (scanner as unknown as { getRunningTrackCameraId?: () => string }).getRunningTrackCameraId?.();
    if (track) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: track } },
      });
      const videoTrack = stream.getVideoTracks()[0];
      return videoTrack || null;
    }
    return null;
  } catch {
    return null;
  }
}
