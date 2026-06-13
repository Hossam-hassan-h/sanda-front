import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SettingsLayout from "@/layouts/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Languages, Key } from "lucide-react";
import PasswordInput from "@/components/common/PasswordInput";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const MIN_CHANGE_PASSWORD_LENGTH = 6;

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lang, setLang] = useState("ar");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!user) {
      setPasswordError("يرجى تسجيل الدخول أولا.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("كل حقول كلمة المرور مطلوبة.");
      return;
    }

    if (newPassword.length < MIN_CHANGE_PASSWORD_LENGTH) {
      setPasswordError("كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("تم تغيير كلمة مرور حسابك بنجاح.");
      toast({ title: "تم تحديث كلمة المرور", description: "تم تغيير كلمة مرور حسابك بنجاح." });
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل تغيير كلمة المرور. حاول مرة أخرى.");
      setPasswordError(message);
      toast({ title: "فشل تغيير كلمة المرور", description: message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="w-full text-right" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1">تعديل تفضيلات وخصوصية حسابك</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Languages className="w-4.5 h-4.5 text-primary" />
                اللغة المفضلة (Language)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
              <span className="text-xs font-semibold">لغة عرض التطبيق</span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" size="sm" variant={lang === "ar" ? "default" : "outline"} onClick={() => setLang("ar")}>
                  العربية
                </Button>
                <Button type="button" size="sm" variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="w-4.5 h-4.5 text-primary" />
                تغيير كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3" noValidate>
                <Feedback message={passwordError} />
                <Feedback message={passwordSuccess} variant="success" />

                <div className="space-y-1">
                  <label className="text-xs" htmlFor="current-password">كلمة المرور الحالية</label>
                  <PasswordInput
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isChangingPassword}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs" htmlFor="new-password">كلمة المرور الجديدة</label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs" htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                    required
                  />
                </div>
                <FormSubmitButton size="sm" className="w-full mt-2" pending={isChangingPassword} pendingLabel="جاري التحديث...">
                  تحديث كلمة المرور
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
