import { useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, Upload, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/auth";
import { USE_MOCKS } from "@/api/client";
import type { VerificationDocument } from "@/api/types";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

interface VerificationUploadProps {
  onSuccess?: () => void;
}

const STORAGE_KEY = "sanda_verification_requests";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function FileUploadZone({
  refObject,
  onChange,
  label,
  fileName,
  placeholder,
  icon: Icon,
  disabled,
}: {
  refObject: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  fileName: string | null;
  placeholder: string;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  const IconComponent = Icon;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold">{label}</Label>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 hover:bg-muted/30 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        onClick={() => {
          if (!disabled) refObject.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            refObject.current?.click();
          }
        }}
      >
        <input
          ref={refObject}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="sr-only"
          disabled={disabled}
        />
        <IconComponent className="mb-2 h-8 w-8 text-muted-foreground" />
        <span className="text-xs font-semibold">{fileName || placeholder}</span>
        <span className="mt-1 text-[10px] text-muted-foreground">PNG, JPG حتى 5MB</span>
      </div>
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function persistVerificationRequest(userId: string, documents: VerificationDocument[]) {
  const request = {
    status: "pending" as const,
    documents,
    submittedAt: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem("sanda_user");
    if (stored) {
      const user = JSON.parse(stored);
      user.verificationRequest = request;
      localStorage.setItem("sanda_user", JSON.stringify(user));
    }
  } catch {
    // Keep upload success even if legacy local cache cannot be updated.
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, typeof request> = stored ? JSON.parse(stored) : {};
    map[userId] = request;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Admin fallback cache is best-effort only.
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
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "pending">("upload");

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are supported.";
    if (file.size > MAX_FILE_SIZE) return "Each image must be 5MB or smaller.";
    return "";
  };

  const setValidatedFile = (file: File | undefined, setter: (file: File | null) => void) => {
    if (!file) return;
    const message = validateFile(file);
    if (message) {
      setError(message);
      toast({ title: "Invalid file", description: message, variant: "destructive" });
      return;
    }
    setError("");
    setter(file);
  };

  const handleUploadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (uploading) return;
    setError("");

    if (!nationalIdFront || !nationalIdBack) {
      const message = "يرجى رفع صور بطاقة الرقم القومي (أمام وخلف).";
      setError(message);
      toast({ title: "الملفات ناقصة", description: message, variant: "destructive" });
      return;
    }
    if (!user) return;

    const selectedFiles = [nationalIdFront, nationalIdBack, personalPhoto].filter(Boolean) as File[];
    const invalidFileMessage = selectedFiles.map(validateFile).find(Boolean);
    if (invalidFileMessage) {
      setError(invalidFileMessage);
      toast({ title: "Invalid file", description: invalidFileMessage, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      if (!USE_MOCKS) {
        await authApi.uploadVerificationDocuments(user.id, { nationalIdFront, nationalIdBack });
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
      updateUser({ verificationRequest: { status: "pending", documents, submittedAt: now } });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setStep("pending");
      toast({ title: "Documents uploaded", description: "Your verification documents are now pending review." });
      onSuccess?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not upload documents. Please try again.");
      setError(message);
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full text-right" dir="rtl">
      <CardContent className="p-6">
        {step === "upload" ? (
          <form onSubmit={handleUploadSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                رفع مستندات التوثيق والأمان
              </h3>
              <p className="text-xs text-muted-foreground">
                ارفع مستندات الهوية حتى يتمكن فريق الإدارة من مراجعة حسابك.
              </p>
            </div>

            <FileUploadZone
              refObject={frontRef}
              onChange={(event) => setValidatedFile(event.target.files?.[0], setNationalIdFront)}
              label="صورة بطاقة الرقم القومي (من الأمام)"
              fileName={nationalIdFront?.name ?? null}
              placeholder="اضغط لرفع الصورة (أمام)"
              icon={Upload}
              disabled={uploading}
            />

            <FileUploadZone
              refObject={backRef}
              onChange={(event) => setValidatedFile(event.target.files?.[0], setNationalIdBack)}
              label="صورة بطاقة الرقم القومي (من الخلف)"
              fileName={nationalIdBack?.name ?? null}
              placeholder="اضغط لرفع الصورة (خلف)"
              icon={Upload}
              disabled={uploading}
            />

            <FileUploadZone
              refObject={photoRef}
              onChange={(event) => setValidatedFile(event.target.files?.[0], setPersonalPhoto)}
              label="صورة شخصية واضحة (اختياري)"
              fileName={personalPhoto?.name ?? null}
              placeholder="اضغط لرفع الصورة الشخصية"
              icon={User}
              disabled={uploading}
            />

            <Feedback>{error}</Feedback>

            <FormSubmitButton className="w-full py-5 font-bold" isPending={uploading} loadingText="جاري رفع الملفات وتشفيرها...">
              إرسال المستندات للمراجعة
            </FormSubmitButton>
          </form>
        ) : (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <ShieldCheck className="h-8 w-8 animate-pulse text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">المستندات قيد المراجعة</h3>
              <p className="text-sm text-muted-foreground">تم استلام مستندات التوثيق بنجاح وجاري تدقيقها حالياً.</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-right text-xs text-blue-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
              <span>سيصلك إشعار عند اكتمال مراجعة الإدارة.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
