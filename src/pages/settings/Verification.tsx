import { useNavigate } from "react-router-dom";
import { ShieldCheck, CheckCircle2, XCircle, FileCheck, User, Clock } from "lucide-react";
import SettingsLayout from "@/layouts/SettingsLayout";
import VerificationUpload from "@/components/VerificationUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

export default function Verification() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <SettingsLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </SettingsLayout>
    );
  }

  // Detect verification request state from user or localStorage
  const vr = (user as { verificationRequest?: { status: string; documents?: unknown[]; submittedAt?: string; rejectionReason?: string } }).verificationRequest;
  const isPending = vr?.status === "pending";
  const isRejected = vr?.status === "rejected";

  return (
    <SettingsLayout>
      <div className="w-full" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">توثيق الحساب</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ارفع المستندات الرسمية باشان تحصل على شارة التوثيق.
          </p>
        </div>

        {/* Status banner */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.isVerified ? "bg-success/10" : isPending ? "bg-blue-100" : isRejected ? "bg-destructive/10" : "bg-warning/10"}`}>
                  {user.isVerified ? (
                    <ShieldCheck className="w-6 h-6 text-success" />
                  ) : isPending ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : isRejected ? (
                    <XCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-warning" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {user.isVerified ? "حسابك موثّق" : isPending ? "طلب التوثيق قيد المراجعة" : isRejected ? "تم رفض طلب التوثيق" : "حسابك غير موثّق"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {user.isVerified
                      ? "تستطيع استلام مبالغ الـ Escrow والتقديم على كل الوظائف."
                      : isPending
                      ? "تم استلام مستنداتك وجاري تدقيها. سنرسل لك إشعاراً عند اتخاذ القرار."
                      : isRejected
                      ? `السبب: ${vr?.rejectionReason || "لم يُحدَّد"} — تقدر تعيد رفع المستندات.`
                      : "ارفع المستندات التالية باشان نقدر نراجع حسابك ونفعيل التوثيق."}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={
                user.isVerified
                  ? "bg-success/10 text-success border-success/20"
                  : isPending
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : isRejected
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-warning/10 text-warning border-warning/20"
              }>
                {user.isVerified ? "موثّق" : isPending ? "قيد المراجعة" : isRejected ? "مرفوض" : "غير موثّق"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Requirement
                icon={<FileCheck className="w-4 h-4" />}
                label="بطاقة الرقم القومي"
                sub="(وجهين)"
                done={user.isVerified}
              />
              <Requirement
                icon={<User className="w-4 h-4" />}
                label="صورة شخصية واضحة"
                sub="اختياري"
                done={!!user.avatar}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload form / pending / rejected / approved */}
        {user.isVerified ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
              <h2 className="font-bold text-lg">كل حاجة تمام</h2>
              <p className="text-sm text-muted-foreground">
                حسابك موثّق وكل الوظائف متاحة ليك. تقدر تحدّث المستندات لو في تغيير.
              </p>
              <Button variant="outline" onClick={() => navigate(`/profile/${user.id}`)}>
                الرجوع للملف الشخصي
              </Button>
            </CardContent>
          </Card>
        ) : isPending ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="font-bold text-lg">المستندات قيد المراجعة</h2>
                <p className="text-sm text-muted-foreground">
                  تم استلام مستندات التوثيق بنجاح وجاري تدقيها حالياً.
                </p>
                {vr?.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    تم الإرسال في {new Date(vr.submittedAt).toLocaleString("ar-EG")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-800 text-right mx-auto max-w-md">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>سنرسل لك إشعاراً فور تفعيل الشارة الخضراء (موثق) على حسابك.</span>
              </div>
              <Button variant="outline" onClick={() => navigate(`/profile/${user.id}`)}>
                الرجوع للملف الشخصي
              </Button>
            </CardContent>
          </Card>
        ) : isRejected ? (
          <>
            <Card className="mb-6 border-destructive/30">
              <CardContent className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="font-bold text-lg">تم رفض طلب التوثيق</h2>
                {vr?.rejectionReason && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    السبب: {vr.rejectionReason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  تقدر تراجع الملاحظات وتعيد رفع المستندات مرة تانية.
                </p>
              </CardContent>
            </Card>
            <VerificationUpload />
          </>
        ) : (
          <VerificationUpload />
        )}

        {/* Help */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          المستندات بتتشفر وتخزن بأمان. فريق سندة بيراجع الحسابات خلال ٢٤ ساعة.
        </p>
      </div>
    </SettingsLayout>
  );
}

function Requirement({
  icon,
  label,
  sub,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : icon}
      </div>
      <div className="text-right">
        <div className="font-semibold text-xs">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
