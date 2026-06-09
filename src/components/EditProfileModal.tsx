import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SkillsInput from "@/components/SkillsInput";
import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import type { User } from "@/api/types";

const GOVERNORATE_CITIES: Record<string, string[]> = {
  "القاهرة": ["وسط البلد", "مدينة نصر", "المعادي", "مصر الجديدة", "الزمالك", "شبرا", "حلوان", "التجمع الخامس", "العباسية", "مصر القديمة"],
  "الجيزة": ["الدقي", "المهندسين", "الهرم", "6 أكتوبر", "العجوزة", "فيصل", "الشيخ زايد"],
  "الإسكندرية": ["سيدي جابر", "محطة الرمل", "المنتزة", "العصافرة", "محرم بك", "كامب شيزار", "سبورتنج", "الأنفوشي"],
  "الدقهلية": ["المنصورة", "طلخا", "نبروه", "بلقاس", "ميت غمر", "دكرنس"],
  "الشرقية": ["الزقازيق", "بلبيس", "أبو كبير", "ههيا", "فاقوس", "منيا القمح"],
  "القليوبية": ["بنها", "شبرا الخيمة", "قليوب", "الخانكة", "طوخ"],
  "الغربية": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة"],
  "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "أبو المطامير", "إيتاي البارود"],
  "المنيا": ["المنيا", "مغاغة", "ملوي", "بني مزار", "أبو قرقاص"],
  "أسيوط": ["أسيوط", "منفلوط", "ديروط", "القوصية", "أبنوب"],
  "سوهاج": ["سوهاج", "طهطا", "جرجا", "أخميم", "دار السلام"],
  "قنا": ["قنا", "نجع حمادي", "قوص", "نقادة"],
  "الأقصر": ["الأقصر", "البياضية", "الطيبة", "الزينية"],
  "أسوان": ["أسوان", "كوم أمبو", "إدفو", "نصر النوبة"],
  "بورسعيد": ["بورسعيد", "الزهور", "الضواحي"],
  "السويس": ["السويس", "عتاقة", "فيصل"],
  "دمياط": ["دمياط", "رأس البر", "عزبة البرج", "كفر سعد"],
  "الإسماعيلية": ["الإسماعيلية", "فايد", "القنطرة", "التل الكبير"],
  "كفر الشيخ": ["كفر الشيخ", "دسوق", "بيلا", "الحامول", "مطوبس"],
  "الفيوم": ["الفيوم", "سنورس", "أطسا", "إبشواي", "طامية"],
  "بني سويف": ["بني سويف", "الواسطى", "ناصر", "الفشن"],
  "الوادي الجديد": ["الخارجة", "الداخلة", "باريس", "بلاط"],
  "مطروح": ["مرسى مطروح", "الضبعة", "العلمين", "سيوة"],
  "شمال سيناء": ["العريش", "بئر العبد", "الشيخ زويد", "رفح"],
  "جنوب سيناء": ["شرم الشيخ", "دهب", "نويبع", "سانت كاترين", "طور سيناء"],
  "البحر الأحمر": ["الغردقة", "القصير", "مرسى علم", "رأس غارب"],
};

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave: (updated: Partial<User>) => void;
}

export default function EditProfileModal({ open, onOpenChange, user, onSave }: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const originalRef = useRef({ bio: "", skills: [] as string[] });

  const governorates = Object.keys(GOVERNORATE_CITIES);
  const cities = governorate ? GOVERNORATE_CITIES[governorate] || [] : [];

  useEffect(() => {
    if (open) {
      setBio(user.bio ?? "");
      setSkills(user.skills ?? []);
      const parts = (user.city ?? "").split("، ");
      setGovernorate(parts[0] || "");
      setDistrict(parts[1] || "");
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsDirty(false);
      setIsSaving(false);
      setShowUnsavedDialog(false);
      originalRef.current = { bio: user.bio ?? "", skills: [...(user.skills ?? [])] };
    }
  }, [open, user]);

  useEffect(() => {
    const orig = originalRef.current;
    const sameBio = bio === orig.bio;
    const sameSkills = skills.length === orig.skills.length && skills.every((s, i) => s === orig.skills[i]);
    const sameAvatar = avatarFile === null;
    setIsDirty(!sameBio || !sameSkills || !sameAvatar);
  }, [bio, skills, avatarFile]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview && !avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    const updated: Partial<User> = {
      bio,
      skills: skills.length > 0 ? skills : undefined,
      city: district ? `${governorate}، ${district}` : governorate || undefined,
    };

    if (avatarPreview && avatarPreview !== user.avatar) {
      updated.avatar = avatarPreview;
    }

    onSave(updated);
    setIsSaving(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty && !showUnsavedDialog) {
      setShowUnsavedDialog(true);
      return;
    }
    setShowUnsavedDialog(false);
    onOpenChange(newOpen);
  };

  const handleKeepEditing = () => setShowUnsavedDialog(false);

  const handleDiscard = () => {
    setBio(originalRef.current.bio);
    setSkills(originalRef.current.skills);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const formFields = (
    <div className="space-y-5 sm:space-y-6 text-right" dir="rtl">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={avatarPreview || user.avatar} />
            <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
            <span className="text-[10px] text-white mt-0.5 font-semibold">تغيير</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
        <span className="text-xs text-muted-foreground">اختر صورة مربعة للحصول على أفضل نتيجة</span>
        {/* Placeholder: Image cropper integration point */}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">نبذة عنك</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 300))}
          placeholder="اكتب نبذة عن خبراتك ومهاراتك المهنية..."
          className="resize-none h-24"
          maxLength={300}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span />
          <span>{bio.length} / 300</span>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{skills.length}/10</span>
          <Label className="text-xs font-semibold">المهارات</Label>
        </div>
        <SkillsInput
          value={skills}
          onChange={(next) => {
            if (next.length <= 10) setSkills(next);
          }}
          placeholder={skills.length >= 10 ? "لقد وصلت للحد الأقصى من المهارات" : "أضف مهارة واضغط Enter..."}
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">الموقع</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={governorate}
              onChange={(e) => { setGovernorate(e.target.value); setDistrict(""); }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-right appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">المحافظة</option>
              {governorates.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!governorate}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-right appearance-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="">المنطقة</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
          حفظ التغييرات
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
        >
          إلغاء
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto my-4 [&>button]:left-4 [&>button]:right-auto">
          <DialogHeader>
            <DialogTitle>تعديل الملف الشخصي</DialogTitle>
          </DialogHeader>
          {formFields}
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onKeepEditing={handleKeepEditing}
        onDiscard={handleDiscard}
        onSaveAndClose={handleSaveAndClose}
        isSaving={isSaving}
      />
    </>
  );
}
