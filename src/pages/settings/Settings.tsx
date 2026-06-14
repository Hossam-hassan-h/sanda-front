import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SettingsLayout from "@/layouts/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Languages, Key } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lang, setLang] = useState("ar");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور الجديدتان غير متطابقتين",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "تم تحديث كلمة المرور",
      description: "تم تغيير كلمة مرور حسابك بنجاح.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <SettingsLayout>
      <div className="w-full text-right" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1">تعديل تفضيلات وخصوصية حسابك</p>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
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
                <Button
                  size="sm"
                  variant={lang === "ar" ? "default" : "outline"}
                  onClick={() => setLang("ar")}
                >
                  العربية
                </Button>
                <Button
                  size="sm"
                  variant={lang === "en" ? "default" : "outline"}
                  onClick={() => setLang("en")}
                >
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="w-4.5 h-4.5 text-primary" />
                تغيير كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs">كلمة المرور الحالية</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">كلمة المرور الجديدة</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">تأكيد كلمة المرور الجديدة</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="w-full mt-2">
                  تحديث كلمة المرور
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
