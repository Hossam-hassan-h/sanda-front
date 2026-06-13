import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";
import { Key } from "lucide-react";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import PasswordInput from "@/components/common/PasswordInput";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export default function AdminSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSuccess(null);

    if (!user?.id) {
      setMessage("يرجى تسجيل الدخول أولا.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("كل حقول كلمة المرور مطلوبة.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }

    setSaving(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("تم تغيير كلمة المرور بنجاح.");
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      const safeMessage = getApiErrorMessage(error, "فشل تغيير كلمة المرور. تحقق من كلمة المرور الحالية.");
      setMessage(safeMessage);
      toast({ title: "خطأ", description: safeMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">الإعدادات</h1>
          <p className="text-muted-foreground">تغيير كلمة المرور وإعدادات الحساب</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-primary" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md" noValidate>
              <Feedback message={message} />
              <Feedback message={success} variant="success" />
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="admin-current-password">كلمة المرور الحالية</label>
                <PasswordInput id="admin-current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={saving} required placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="admin-new-password">كلمة المرور الجديدة</label>
                <PasswordInput id="admin-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={saving} required placeholder="6 أحرف على الأقل" autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="admin-confirm-password">تأكيد كلمة المرور الجديدة</label>
                <PasswordInput id="admin-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={saving} required placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" />
              </div>
              <FormSubmitButton pending={saving} pendingLabel="جاري الحفظ...">
                حفظ التغييرات
              </FormSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الاسم</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">البريد الإلكتروني</span>
              <span className="font-medium">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الدور</span>
              <span className="font-medium">مسؤول</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
