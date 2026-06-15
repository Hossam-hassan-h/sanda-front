import { useRef, useState } from "react";
import { Upload, CheckCircle2, ShieldCheck, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { USE_MOCKS } from "@/api/client";
import type { VerificationDocument } from "@/api/types";

interface VerificationUploadProps {
  onSuccess?: () => void;
}

function FileUploadZone({
  refObject,
  onChange,
  label,
  fileName,
  placeholder,
  icon: Icon,
}: {
  refObject: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  fileName: string | null;
  placeholder: string;
  icon: React.ElementType;
}) {
  const IconComponent = Icon;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold">{label}</Label>
      <div
        role="button"
        tabIndex={0}
        className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center hover:bg-muted/30 cursor-pointer"
        onClick={() => refObject.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            refObject.current?.click();
          }
        }}
      >
        <input
          ref={refObject}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="sr-only"
        />
        <IconComponent className="w-8 h-8 text-muted-foreground mb-2" />
        <span className="text-xs font-semibold">
          {fileName || placeholder}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG حتى 5MB</span>
      </div>
    </div>
  );
}

/** Convert a File to a base64 data URL so it can be stored in localStorage */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STORAGE_KEY = "sanda_verification_requests";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Save the verification request both to the user (in localStorage) and to a global map for admins */
function persistVerificationRequest(
  userId: string,
  documents: VerificationDocument[]
) {
  const request = {
    status: "pending" as const,
    documents,
    submittedAt: new Date().toISOString(),
  };

  // Update the user's localStorage profile
  try {
    const stored = localStorage.getItem("sanda_user");
    if (stored) {
      const user = JSON.parse(stored);
      user.verificationRequest = request;
      localStorage.setItem("sanda_user", JSON.stringify(user));
    }
  } catch {
    // Ignore parse errors
  }

  // Save to global map (so admins can see all pending requests)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, typeof request> = stored ? JSON.parse(stored) : {};
    map[userId] = request;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export default function VerificationUpload({ onSuccess }: VerificationUploadProps) {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [nationalIdFront, setNationalIdFront] = useState<File | null>(null);
  const [nationalIdBack, setNationalIdBack] = useState<File | null>(null);
  const [personalPhoto, setPersonalPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "pending">("upload");

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalIdFront || !nationalIdBack) {
      toast({
        title: "الملفات ناقصة",
        description: "يرجى رفع صور بطاقة الرقم القومي (أمام وخلف).",
        variant: "destructive",
      });
      return;
    }
    if (!user) return;

    const selectedFiles = [nationalIdFront, nationalIdBack, personalPhoto].filter(Boolean) as File[];
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      toast({
        title: "الملف كبير جداً",
        description: "الحد الأقصى لكل صورة هو 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (!USE_MOCKS) {
        await authApi.uploadVerificationDocuments(user.id, {
          nationalIdFront,
          nationalIdBack,
        });
      }

      const now = new Date().toISOString();
      const documents: VerificationDocument[] = [
        {
          id: `vd-${Date.now()}-front`,
          type: "national_id_front",
          name: nationalIdFront.name,
          url: await readFileAsDataURL(nationalIdFront),
          size: nationalIdFront.size,
          uploadedAt: now,
        },
        {
          id: `vd-${Date.now()}-back`,
          type: "national_id_back",
          name: nationalIdBack.name,
          url: await readFileAsDataURL(nationalIdBack),
          size: nationalIdBack.size,
          uploadedAt: now,
        },
      ];
      if (personalPhoto) {
        documents.push({
          id: `vd-${Date.now()}-photo`,
          type: "personal_photo",
          name: personalPhoto.name,
          url: await readFileAsDataURL(personalPhoto),
          size: personalPhoto.size,
          uploadedAt: now,
        });
      }

      persistVerificationRequest(user.id, documents);
      // Refresh user so the page updates immediately
      updateUser({ verificationRequest: { status: "pending", documents, submittedAt: new Date().toISOString() } });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      setStep("pending");
      toast({
        title: "تم رفع المستندات",
        description: "جاري مراجعة مستنداتك من قبل الإدارة. سيتم تفعيل حسابك خلال ٢٤ ساعة.",
      });
      onSuccess?.();
    } catch (err) {
      toast({
        title: "فشل الرفع",
        description: "حصل خطأ أثناء رفع المستندات. حاول مرة تانية.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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

            <FileUploadZone
              refObject={frontRef}
              onChange={(e) => {
                if (e.target.files?.[0]) setNationalIdFront(e.target.files[0]);
              }}
              label="صورة بطاقة الرقم القومي (من الأمام)"
              fileName={nationalIdFront?.name ?? null}
              placeholder="اضغط لرفع الصورة (أمام)"
              icon={Upload}
            />

            <FileUploadZone
              refObject={backRef}
              onChange={(e) => {
                if (e.target.files?.[0]) setNationalIdBack(e.target.files[0]);
              }}
              label="صورة بطاقة الرقم القومي (من الخلف)"
              fileName={nationalIdBack?.name ?? null}
              placeholder="اضغط لرفع الصورة (خلف)"
              icon={Upload}
            />

            <FileUploadZone
              refObject={photoRef}
              onChange={(e) => {
                if (e.target.files?.[0]) setPersonalPhoto(e.target.files[0]);
              }}
              label="صورة شخصية واضحة (اختياري)"
              fileName={personalPhoto?.name ?? null}
              placeholder="اضغط لرفع الصورة الشخصية"
              icon={User}
            />

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
