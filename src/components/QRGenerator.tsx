import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Download, LogOut, RefreshCw } from "lucide-react";

import ReportForm from "@/components/ReportForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useGenerateCheckInQR, useGenerateCheckOutQR, useRefundAssignment } from "@/hooks/useJobAssignments";
import { getApiErrorMessage } from "@/lib/api-error";

interface QRGeneratorProps {
  assignmentId: string;
  assignmentStatus?: string;
  marketplaceStatus?: string;
  refundDeadline?: string | null;
  workerId?: string;
  workerName?: string;
}

export default function QRGenerator({
  assignmentId,
  assignmentStatus,
  marketplaceStatus,
  refundDeadline,
  workerId,
  workerName,
}: QRGeneratorProps) {
  const [qrImage, setQrImage] = useState("");
  const [qrType, setQrType] = useState<"check_in" | "check_out">("check_in");
  const generateCheckInQR = useGenerateCheckInQR();
  const generateCheckOutQR = useGenerateCheckOutQR();
  const refundAssignment = useRefundAssignment();
  const isPending = generateCheckInQR.isPending || generateCheckOutQR.isPending || refundAssignment.isPending;

  const handleGenerate = async (type: "check_in" | "check_out") => {
    if (isPending) return;
    try {
      const mutation = type === "check_in" ? generateCheckInQR : generateCheckOutQR;
      const result = await mutation.mutateAsync(assignmentId);
      setQrType(type);
      const qrPayload = JSON.stringify({ assignmentId, qrToken: result.qrToken, type });
      setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`);
    } catch (error) {
      toast({ title: "QR generation failed", description: getApiErrorMessage(error, "Please try again."), variant: "destructive" });
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

  const handleRefund = async () => {
    if (isPending) return;
    try {
      await refundAssignment.mutateAsync(assignmentId);
      toast({ title: "Refund requested", description: "The refund action was completed." });
    } catch (error) {
      toast({ title: "Refund failed", description: getApiErrorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  const hasCheckedIn = assignmentStatus === "checked-in" || assignmentStatus === "checked-out";
  const hasCheckedOut = assignmentStatus === "checked-out";
  const refundWindowActive = marketplaceStatus === "REFUND_WINDOW_ACTIVE";

  if (hasCheckedOut) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-4 text-center">
          <CheckCircle className="mx-auto mb-1 h-6 w-6 text-green-600" />
          <p className="text-sm font-medium text-green-700">Checked out</p>
          {workerName && <p className="mt-1 text-xs text-muted-foreground">{workerName}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">{workerName && `${workerName} - `}Generate QR</div>
        </div>

        {qrImage ? (
          <div className="space-y-3">
            <div className="relative mx-auto inline-block">
              <img src={qrImage} alt="QR Code" className="h-36 w-36 rounded-xl border-2 border-primary/20" />
              <Badge className={`absolute -right-2 -top-2 ${qrType === "check_in" ? "bg-blue-500" : "bg-amber-500"} text-white`}>
                {qrType === "check_in" ? "Check-in" : "Check-out"}
              </Badge>
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => handleGenerate(qrType)} disabled={isPending}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            {!hasCheckedIn && (
              <Button type="button" size="sm" variant="outline" onClick={() => handleGenerate("check_in")} disabled={isPending}>
                <Clock className="h-4 w-4" />
                Check-in QR
              </Button>
            )}
            {hasCheckedIn && (
              <Button type="button" size="sm" variant="default" onClick={() => handleGenerate("check_out")} disabled={isPending}>
                <LogOut className="h-4 w-4" />
                Check-out QR
              </Button>
            )}
          </div>
        )}

        {refundWindowActive && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="mb-2 flex items-center gap-1 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Refund available until {refundDeadline ? new Date(refundDeadline).toLocaleTimeString() : "deadline"}
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={handleRefund} disabled={isPending}>
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
              trigger={<Button type="button" size="sm" variant="outline">Report absence</Button>}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
