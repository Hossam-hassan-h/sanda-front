import { useState } from "react";
import { Upload, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface VerificationUploadProps {
  onSuccess?: () => void;
}

export default function VerificationUpload({ onSuccess }: VerificationUploadProps) {
  const [nationalIdFront, setNationalIdFront] = useState<File | null>(null);
  const [nationalIdBack, setNationalIdBack] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "pending">("upload");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "front") setNationalIdFront(file);
      else if (type === "back") setNationalIdBack(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalIdFront || !nationalIdBack) {
      toast({
        title: "الملفات ناقصة",
        description: "يرجى رفع صور بطاقة الرقم القومي (أمام وخلف).",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    // Simulate uploading documents to server
    setTimeout(() => {
      setUploading(false);
      setStep("pending");
      toast({
        title: "تم رفع المستندات",
        description: "جاري مراجعة مستنداتك من قبل الإدارة. سيتم تفعيل حسابك خلال ٢٤ ساعة.",
      });
      onSuccess?.();
    }, 2000);
  };

  return (
    <Card className="w-full text-right" dir="rtl">
      <CardContent className="p-6">
        {step === "upload" ? (
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                رفع مستندات التوثيق والأمان
              </h3>
              <p className="text-xs text-muted-foreground">
                لكي تتمكن من العمل واستلام مبالغ الضمان، يجب تقديم وثائق إثبات الهوية الشخصية.
              </p>
            </div>

            {/* National ID Front */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">صورة بطاقة الرقم القومي (من الأمام)</Label>
              <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/30 cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold">
                  {nationalIdFront ? nationalIdFront.name : "اضغط لرفع الصورة (أمام)"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG حتى 5MB</span>
              </div>
            </div>

            {/* National ID Back */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">صورة بطاقة الرقم القومي (من الخلف)</Label>
              <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/30 cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "back")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold">
                  {nationalIdBack ? nationalIdBack.name : "اضغط لرفع الصورة (خلف)"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG حتى 5MB</span>
              </div>
            </div>

            <Button type="submit" className="w-full py-5 font-bold" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري رفع الملفات وتشفيرها...
                </>
              ) : (
                "إرسال المستندات للمراجعة"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">المستندات قيد المراجعة</h3>
              <p className="text-sm text-muted-foreground">
                تم استلام مستندات التوثيق بنجاح وجاري تدقيقها حالياً.
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-800 text-right">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
              <span>سنرسل لك إشعاراً فور تفعيل الشارة الخضراء (موثق) على حسابك.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
