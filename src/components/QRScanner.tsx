import { useState, useRef, useEffect } from "react";
import { Camera, ScanLine, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCheckIn } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface QRScannerProps {
  jobId?: string;
}

export default function QRScanner({ jobId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkIn = useCheckIn();

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch (err) {
        toast({
          title: "خطأ في الكاميرا",
        description: "يرجى السماح بالوصول للكاميرا",
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Handle manual QR input (fallback)
  const handleManualInput = async () => {
    if (!scannedData.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال بيانات QR", variant: "destructive" });
      return;
    }
    await processCheckIn(scannedData);
  };

  // Process check-in
  const processCheckIn = async (qrCode: string) => {
    try {
      const targetJobId = jobId || extractJobIdFromQR(qrCode);
      if (!targetJobId) {
        throw new Error("معرف الوظيفة غير موجود");
      }
      await checkIn.mutateAsync({ jobId: targetJobId, qrCode });
      setResult("success");
      toast({ title: "تم تسجيل الحضور", description: "تم تسجيل دخولك بنجاح" });
    } catch {
      setResult("error");
      toast({ title: "خطأ", description: "فشل في تسجيل الحضور", variant: "destructive" });
    } finally {
      setShowResult(true);
      stopCamera();
    }
  };

  // Extract jobId from QR data
  const extractJobIdFromQR = (qrData: string): string | null => {
    try {
      const parsed = JSON.parse(qrData);
      return parsed.jobId || null;
    } catch {
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanLine className="w-5 h-5" />
          مسح QR Code — تسجيل الحضور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
          {scanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/80 rounded-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  وجه الكاميرا نحو QR Code
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={stopCamera}
              >
                <XCircle className="w-4 h-4 mr-1" />
                إيقاف
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <Camera className="w-16 h-16 mb-4" />
              <p className="text-sm">اضغط لبدء المسح</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          {!scanning ? (
            <Button onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" />
              فتح الكاميرا
            </Button>
          ) : (
            <Button variant="outline" onClick={stopCamera}>
              <XCircle className="w-4 h-4 mr-2" />
              إغلاق الكاميرا
            </Button>
          )}
        </div>

        {/* Manual Input Fallback */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">
            أو أدخل بيانات QR يدوياً
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
              disabled={checkIn.isPending || !scannedData.trim()}
            >
              {checkIn.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              تسجيل
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              {result === "success" ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <span>تم تسجيل الحضور بنجاح!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <span>فشل في تسجيل الحضور</span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-muted-foreground">
            {result === "success"
              ? "تم تسجيل دخولك للعمل. سيتم تحويل المبلغ إلى محفظتك بعد انتهاء العمل."
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
