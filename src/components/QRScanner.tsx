import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, ScanLine, CheckCircle, XCircle, Loader2, Sun, SwitchCamera, AlertTriangle } from "lucide-react";
import jsQR from "jsqr";
import { useCheckInWithQR, useCheckOutWithQR } from "@/hooks/useJobAssignments";
import { useQrScanner } from "@/hooks/useQrScanner";
import { playScanSound, vibrateOnScan } from "@/utils/audio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/password-reset";

interface QRScannerProps {
  onScanComplete?: (success: boolean) => void;
}

export default function QRScanner({ onScanComplete }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  
  // Refs
  const scanCompleteCalledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkInWithQR = useCheckInWithQR();
  const checkOutWithQR = useCheckOutWithQR();
  const isPending = checkInWithQR.isPending || checkOutWithQR.isPending;

  const { state, error, devices, switchCamera, toggleTorch, isTorchOn, torchSupported, start, stop } = useQrScanner({
    fps: 12,
    qrboxSize: 280,
    onSuccess: handleScanSuccess,
    onError: (err) => {
      if (err.type === "PERMISSION_DENIED") {
        toast({ title: "صلاحية الكاميرا", description: getApiErrorMessage(err, "فشل الوصول إلى الكاميرا"), variant: "destructive" });
      }
    },
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
          setGpsError(false);
        },
        () => {
          setGpsLoading(false);
          setGpsError(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsError(true);
    }
  }, []);

  function handleScanSuccess(decodedText: string) {
    scanCompleteCalledRef.current = false;
    vibrateOnScan();
    playScanSound();
    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 300);
    processQR(decodedText);
  }

  const stopCamera = useCallback(() => {
    stop();
    setScanning(false);
  }, [stop]);

  const processQR = useCallback(async (qrData: string) => {
    if (scanCompleteCalledRef.current) return;
    let success = false;
    try {
      const parsed = JSON.parse(qrData);
      const { assignmentId, qrToken, type } = parsed;
      if (!assignmentId || !qrToken || !type) {
        throw new Error("بيانات QR غير صالحة");
      }
      const payload = { assignmentId, qrToken, location: gpsLocation ?? undefined };
      if (type === "check_in") {
        await checkInWithQR.mutateAsync(payload);
        toast({ title: "تم تسجيل الحضور", description: "تم تسجيل دخولك بنجاح" });
      } else if (type === "check_out") {
        await checkOutWithQR.mutateAsync(payload);
        toast({ title: "تم تسجيل الانصراف", description: "تم تسجيل خروجك بنجاح" });
      } else {
        throw new Error("نوع QR غير معروف");
      }
      success = true;
      setResult("success");
    } catch (err) {
      setResult("error");
      toast({ title: "خطأ", description: getApiErrorMessage(err, "فشل في تسجيل QR"), variant: "destructive" });
    } finally {
      setShowResult(true);
      stopCamera();
      scanCompleteCalledRef.current = true;
      onScanComplete?.(success);
    }
  }, [checkInWithQR, checkOutWithQR, onScanComplete, gpsLocation, stopCamera]);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      processQR(code.data);
      return;
    }
    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [processQR]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      toast({
        title: "خطأ",
        description: getApiErrorMessage(error, "فشل في تشغيل الكاميرا"),
        variant: "destructive",
      });
      setScanning(false);
    }
  }, [scanFrame]);

  const handleStartCamera = async () => {
    setScanning(true);
    await start();
  };

  const handleStopCamera = async () => {
    await stop();
    setScanning(false);
  };

  const handleManualInput = async () => {
    if (!scannedData.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال بيانات QR", variant: "destructive" });
      return;
    }
    await processQR(scannedData);
  };

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  const scannerErrorUi = error && (
    <div className="flex flex-col items-center justify-center h-full text-white/80 p-6 text-center">
      {error.type === "PERMISSION_DENIED" && (
        <>
          <AlertTriangle className="w-12 h-12 mb-3 text-yellow-400" />
          <p className="text-sm mb-2">{error.message}</p>
          <p className="text-xs text-white/60">يمكنك تغيير صلاحية الكاميرا من إعدادات الجهاز</p>
        </>
      )}
      {error.type === "NO_CAMERA" && (
        <>
          <Camera className="w-12 h-12 mb-3 text-white/40" />
          <p className="text-sm mb-2">{error.message}</p>
          <p className="text-xs text-white/60">يرجى استخدام الإدخال اليدوي بدلاً من الكاميرا</p>
        </>
      )}
      {error.type === "HTTPS_REQUIRED" && (
        <>
          <AlertTriangle className="w-12 h-12 mb-3 text-yellow-400" />
          <p className="text-sm mb-2">{error.message}</p>
          <p className="text-xs text-white/60">التطبيق يحتاج إلى اتصال آمن (HTTPS) لتشغيل الكاميرا</p>
        </>
      )}
      {error.type === "INIT_FAILURE" && (
        <>
          <XCircle className="w-12 h-12 mb-3 text-red-400" />
          <p className="text-sm mb-2">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2 text-white border-white/30" onClick={handleStartCamera}>
            إعادة المحاولة
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanLine className="w-5 h-5" />
          مسح QR Code
        </CardTitle>
        {gpsLoading && <p className="text-xs text-muted-foreground mt-1">جاري تحديد الموقع...</p>}
        {gpsError && !gpsLoading && <p className="text-xs text-amber-500 mt-1">الموقع غير متاح - سيتم التسجيل بدونه</p>}
        {gpsLocation && <p className="text-xs text-green-600 mt-1">تم تحديد الموقع</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
          {/* Scanner viewport */}
          <div id="sanda-qr-reader" className={`w-full h-full ${scanning && state !== "error" ? "" : "hidden"}`} />

          {/* Loading */}
          {scanning && state === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Success flash overlay */}
          {showFlashOverlay && (
            <div className="absolute inset-0 bg-green-500/30 z-10 transition-opacity" />
          )}

          {/* Scanning overlay frame */}
          {scanning && state === "scanning" && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]">
                <div className="absolute inset-0 border-2 border-white/80 rounded-lg">
                  <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
                وجه الكاميرا نحو QR Code
              </div>
            </div>
          )}

          {/* Error overlay */}
          {scanning && state === "error" && scannerErrorUi}

          {/* Camera controls overlay */}
          {scanning && state === "scanning" && (
            <div className="absolute top-2 right-2 left-2 flex justify-between z-20">
              <div className="flex gap-1">
                {devices.length > 1 && (
                  <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white" onClick={switchCamera}>
                    <SwitchCamera className="w-4 h-4" />
                  </Button>
                )}
                {torchSupported && (
                  <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white" onClick={toggleTorch}>
                    <Sun className={`w-4 h-4 ${isTorchOn ? "text-yellow-400" : ""}`} />
                  </Button>
                )}
              </div>
              <Button variant="destructive" size="icon" className="w-8 h-8" onClick={handleStopCamera}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Pre-scan placeholder */}
          {!scanning && (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <Camera className="w-16 h-16 mb-4" />
              <p className="text-sm">اضغط لبدء المسح</p>
            </div>
          )}
        </div>

        {/* Camera controls */}
        <div className="flex gap-2 justify-center">
          {!scanning ? (
            <Button onClick={handleStartCamera} disabled={error?.type === "HTTPS_REQUIRED"}>
              <Camera className="w-4 h-4 ml-2" />
              فتح الكاميرا
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStopCamera}>
              <XCircle className="w-4 h-4 ml-2" />
              إغلاق الكاميرا
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? "إخفاء" : "إدخال يدوي"}
          </Button>
        </div>

        {/* Manual input */}
        {manualMode && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              أدخل بيانات QR يدوياً
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                placeholder="لصق بيانات QR هنا..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button
                onClick={handleManualInput}
                disabled={isPending || !scannedData.trim()}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 ml-2" />
                )}
                تسجيل
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              {result === "success" ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <span>تم التسجيل بنجاح!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <span>فشل في التسجيل</span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-muted-foreground">
            {result === "success"
              ? "تم تسجيل العملية بنجاح"
              : "يرجى التأكد من صحة QR Code والمحاولة مرة أخرى."}
          </div>
          <Button onClick={() => setShowResult(false)} className="w-full">
            حسناً
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
