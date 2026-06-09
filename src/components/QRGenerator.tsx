import { useState, useEffect } from "react";
import { QrCode, Download, RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useGenerateQR } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface QRGeneratorProps {
  jobId: string;
  jobTitle: string;
  jobStatus: string;
}

export default function QRGenerator({ jobId, jobTitle, jobStatus }: QRGeneratorProps) {
  const [qrImage, setQrImage] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const generateQR = useGenerateQR();

  const handleGenerate = async () => {
    try {
      const result = await generateQR.mutateAsync({ jobId });
      setQrImage(result.qrCode);
      setQrData(result.qrData);
      // QR expires in 24 hours
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setExpiresAt(expiry);
      toast({ title: "تم توليد QR Code", description: "صالح لمدة 24 ساعة" });
    } catch {
      toast({ title: "خطأ", description: "فشل في توليد QR Code", variant: "destructive" });
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("منتهي الصلاحية");
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}س ${minutes}د`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `sanda-qr-${jobId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "تم التحميل", description: "QR Code تم حفظه بنجاح" });
  };

  if (jobStatus !== "in-progress") {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            QR Code متاح فقط للوظائف النشطة (in-progress)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="w-5 h-5" />
          QR Code — تسجيل الحضور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrImage ? (
          <div className="text-center py-6">
            <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط لتوليد QR Code فريد للعامل لتسجيل حضوره
            </p>
            <Button onClick={handleGenerate} disabled={generateQR.isPending}>
              {generateQR.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              توليد QR Code
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {/* QR Image */}
            <div className="relative inline-block">
              <img
                src={qrImage}
                alt="QR Code"
                className="w-64 h-64 rounded-lg border-2 border-primary/20"
              />
              <Badge className="absolute top-2 right-2 bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                نشط
              </Badge>
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>ينتهي خلال: {timeLeft}</span>
            </div>

            {/* Job Info */}
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium">{jobTitle}</p>
              <p className="text-muted-foreground text-xs mt-1">
                Job ID: {jobId}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                تحميل
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تجديد
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              اعرض QR Code للعامل عند وصوله لمسحه وتسجيل الحضور
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
