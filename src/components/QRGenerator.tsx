import { useState, useEffect } from "react";
import { QrCode, RefreshCw, CheckCircle, Download, AlertTriangle } from "lucide-react";
import { useGenerateQR } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QRGeneratorProps {
  jobId: string;
  jobTitle: string;
  jobStatus: string;
}

export default function QRGenerator({ jobId, jobTitle, jobStatus }: QRGeneratorProps) {
  const [qrImage, setQrImage] = useState<string>("");
  const generateQR = useGenerateQR();

  // Auto-generate QR on mount if job is in-progress
  useEffect(() => {
    if (jobStatus === "in-progress" && !qrImage) {
      handleGenerate();
    }
  }, [jobStatus]);

  const handleGenerate = async () => {
    try {
      const result = await generateQR.mutateAsync({ jobId });
      setQrImage(result.qrCode);
    } catch {
      // silent
    }
  };

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `sanda-qr-${jobId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (jobStatus !== "in-progress") {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            QR Code بيظهر لما تبدأ الوظيفة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center">
      <h2 className="font-heading font-bold text-xl mb-1">QR Code الحضور</h2>
      <p className="text-sm text-muted-foreground mb-6">
        اعرض الكود للعامل يمسحه لتسجيل الحضور والانصراف
      </p>

      {generateQR.isPending ? (
        <div className="w-48 h-48 mx-auto bg-muted rounded-xl flex items-center justify-center animate-pulse">
          <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      ) : qrImage ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={qrImage}
              alt="QR Code"
              className="w-48 h-48 rounded-xl border-2 border-primary/20"
            />
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              نشط
            </Badge>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">{jobTitle}</p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />
              تحميل
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerate}>
              <RefreshCw className="w-4 h-4 mr-1" />
              تجديد
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={generateQR.isPending}>
          <QrCode className="w-4 h-4 mr-2" />
          توليد QR Code
        </Button>
      )}
    </div>
  );
}