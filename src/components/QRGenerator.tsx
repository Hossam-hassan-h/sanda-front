import { useState } from "react";
import { RefreshCw, CheckCircle, Download, AlertTriangle, Clock, LogOut } from "lucide-react";
import { useGenerateCheckInQR, useGenerateCheckOutQR, useRefundAssignment } from "@/hooks/useJobAssignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/password-reset";
import ReportForm from "@/components/ReportForm";

interface QRGeneratorProps {
  assignmentId: string;
  assignmentStatus?: string;
  marketplaceStatus?: string;
  refundDeadline?: string | null;
  workerId?: string;
  workerName?: string;
}

export default function QRGenerator({ assignmentId, assignmentStatus, marketplaceStatus, refundDeadline, workerId, workerName }: QRGeneratorProps) {
  const [qrImage, setQrImage] = useState<string>("");
  const [qrType, setQrType] = useState<"check_in" | "check_out">("check_in");
  const generateCheckInQR = useGenerateCheckInQR();
  const generateCheckOutQR = useGenerateCheckOutQR();
  const refundAssignment = useRefundAssignment();
  const isPending = generateCheckInQR.isPending || generateCheckOutQR.isPending || refundAssignment.isPending;

  const handleGenerate = async (type: "check_in" | "check_out") => {
    if (isPending) return;
    try {
      const fn = type === "check_in" ? generateCheckInQR : generateCheckOutQR;
      const result = await fn.mutateAsync(assignmentId);
      setQrType(type);
      const qrPayload = JSON.stringify({ assignmentId, qrToken: result.qrToken, type });
      setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`);
    } catch (err) {
      toast({ title: "فشل إنشاء QR", description: getApiErrorMessage(err, "حاول مرة أخرى"), variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `sanda-qr-${assignmentId}-${qrType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasCheckedIn = assignmentStatus === "checked-in" || assignmentStatus === "checked-out";
  const hasCheckedOut = assignmentStatus === "checked-out";
  const refundWindowActive = marketplaceStatus === "REFUND_WINDOW_ACTIVE";

  if (hasCheckedOut) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
          <p className="text-sm font-medium text-green-700">تم الانصراف</p>
          {workerName && <p className="text-xs text-muted-foreground mt-1">{workerName}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">{workerName && `${workerName} — `}توليد QR</div>
        </div>

        {qrImage ? (
          <div className="space-y-3">
            <div className="relative inline-block mx-auto">
              <img
                src={qrImage}
                alt="QR Code"
                className="w-36 h-36 rounded-xl border-2 border-primary/20"
              />
              <Badge className={`absolute -top-2 -right-2 ${qrType === "check_in" ? "bg-blue-500" : "bg-amber-500"} text-white`}>
                {qrType === "check_in" ? "حضور" : "انصراف"}
              </Badge>
            </div>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleGenerate(qrType)} disabled={isPending}>
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            {!hasCheckedIn && (
              <Button size="sm" variant="outline" onClick={() => handleGenerate("check_in")} disabled={isPending}>
                <Clock className="w-4 h-4 ml-1" />
                QR حضور
              </Button>
            )}
            {hasCheckedIn && (
              <Button size="sm" variant="default" onClick={() => handleGenerate("check_out")} disabled={isPending}>
                <LogOut className="w-4 h-4 ml-1" />
                QR انصراف
              </Button>
            )}
          </div>
        )}

        {refundWindowActive && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="mb-2 text-amber-800">
              Refund available until {refundDeadline ? new Date(refundDeadline).toLocaleTimeString() : "deadline"}
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await refundAssignment.mutateAsync(assignmentId);
                  toast({ title: "Refund processed" });
                } catch (err) {
                  toast({
                    title: "Refund failed",
                    description: err instanceof Error ? err.message : "Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isPending}
            >
              Refund employer
            </Button>
          </div>
        )}

        {workerId && !hasCheckedOut && (
          <div className="mt-3 flex justify-center">
            <ReportForm
              reportedUserId={workerId}
              reportedUserName={workerName}
              assignmentId={assignmentId}
              trigger={<Button size="sm" variant="outline">Report absence</Button>}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
