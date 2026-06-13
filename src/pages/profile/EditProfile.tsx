import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import SkillsInput from "@/components/SkillsInput";
import { ArrowLeft, User } from "lucide-react";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export default function EditProfile() {
  const { user, switchRole, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [city, setCity] = useState(user?.city || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8 text-center text-muted-foreground">يرجى تسجيل الدخول لتعديل حسابك.</div>
      </UserLayout>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name: name.trim(),
      bio: bio.trim(),
      city: city.trim(),
      skills: user.role === "worker" ? skills : [],
    };

    if (!payload.name) {
      setFormError("الاسم مطلوب.");
      return;
    }
    if (payload.name.length > 100) {
      setFormError("الاسم لا يزيد عن 100 حرف.");
      return;
    }
    if (payload.bio.length > 500) {
      setFormError("النبذة لا تزيد عن 500 حرف.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(user.id, payload);
      updateUser(updatedUser);
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات ملفك الشخصي بنجاح." });
      navigate(`/profile/${user.id}`);
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل حفظ البيانات الجديدة.");
      setFormError(message);
      toast({ title: "خطأ", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl text-right" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="رجوع">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل الملف الشخصي</h1>
            <p className="text-sm text-muted-foreground">قم بتحديث معلوماتك الشخصية والمهنية</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              البيانات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5" noValidate>
              <Feedback message={formError} />
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold">الاسم بالكامل</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required aria-invalid={!name.trim()} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs font-semibold">المدينة</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} placeholder="القاهرة، الجيزة، الإسكندرية..." />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio" className="text-xs font-semibold">نبذة شخصية (Bio)</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} disabled={loading} maxLength={500} placeholder="اكتب نبذة قصيرة عن مهاراتك أو خدماتك..." className="resize-none h-24" />
                <div className="text-xs text-muted-foreground text-end">{bio.length}/500</div>
              </div>

              {user.role === "worker" && (
                <div className="space-y-1 border-t pt-4">
                  <Label className="text-xs font-bold block mb-2">المهارات المكتسبة</Label>
                  <SkillsInput value={skills} onChange={setSkills} />
                </div>
              )}

              <div className="border-t pt-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold block">تغيير نوع الحساب (تجريبي)</span>
                  <span className="text-[10px] text-muted-foreground">التحويل متاح فقط في بيئة التطوير.</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant={user.role === "worker" ? "default" : "outline"} size="sm" onClick={() => { switchRole("worker"); window.location.reload(); }}>
                    عامل
                  </Button>
                  <Button type="button" variant={user.role === "employer" ? "default" : "outline"} size="sm" onClick={() => { switchRole("employer"); window.location.reload(); }}>
                    صاحب عمل
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <FormSubmitButton className="flex-1" pending={loading} pendingLabel="جاري الحفظ...">
                  حفظ التغييرات
                </FormSubmitButton>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
