import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordInput from "@/components/PasswordInput";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/password-reset";
import { Key } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمتا المرور الجديدتان غير متطابقتين", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (user?.id) await authApi.updatePassword(user.id, { currentPassword, newPassword });
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({ title: "خطأ", description: getApiErrorMessage(err, "فشل تغيير كلمة المرور. تحقق من كلمة المرور الحالية"), variant: "destructive" });
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
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور الحالية</label>
                <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
                <PasswordInput autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="٨ أحرف على الأقل" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تأكيد كلمة المرور الجديدة</label>
                <PasswordInput autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="أعد كتابة كلمة المرور" />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
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
