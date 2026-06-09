import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/components/LocationPicker";
import { useCreateJob } from "@/hooks/useJobs";
import { toast } from "@/hooks/use-toast";
import type { Location } from "@/api/types";

interface FormValues {
  title: string; description: string; category: string; city: string;
  price: number; hours: number; startDate: string;
}

const categories = ["ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل"];
const cities = ["القاهرة", "الجيزة", "الإسكندرية", "المنصورة"];

export default function PostJob() {
  const navigate = useNavigate();
  const create = useCreateJob();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>();

  const [location, setLocation] = useState<Location>({ address: "", method: "manual" });

  const onSubmit = async (values: FormValues) => {
    if (!location.address) {
      toast({ title: "العنوان التفصيلي مطلوب", variant: "destructive" });
      return;
    }
    const job = await create.mutateAsync({
      ...values,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      method: location.method,
    });
    toast({ title: "تم نشر الوظيفة بنجاح", description: "هتبدأ تستقبل تقديمات قريباً." });
    navigate(`/jobs/${job.id}`);
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl">انشر وظيفة جديدة</h1>
            <p className="text-muted-foreground">املأ التفاصيل وعمال سندة هيتقدموا في دقايق.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-6 space-y-5">
          <div>
            <Label htmlFor="title">عنوان الوظيفة *</Label>
            <Input id="title" placeholder="مثال: نادل لحفل زفاف ٦ ساعات" {...register("title", { required: "العنوان مطلوب" })} />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الفئة *</Label>
              <Select onValueChange={(v) => setValue("category", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("category", { required: "اختر فئة" })} />
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <Label>المدينة *</Label>
              <Select onValueChange={(v) => setValue("city", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("city", { required: "اختر مدينة" })} />
              {errors.city && <p className="text-destructive text-sm mt-1">{errors.city.message}</p>}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <LocationPicker
              value={location}
              onChange={setLocation}
              addressError={!location.address ? "العنوان التفصيلي مطلوب" : undefined}
            />
          </div>

          <div>
            <Label htmlFor="description">وصف العمل *</Label>
            <Textarea id="description" rows={5} placeholder="اشرح المهام المطلوبة، الزي، أي شروط خاصة..." {...register("description", { required: "الوصف مطلوب" })} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">السعر (جنيه) *</Label>
              <Input id="price" type="number" min={50} placeholder="500" {...register("price", { required: true, valueAsNumber: true, min: 50 })} />
            </div>
            <div>
              <Label htmlFor="hours">عدد الساعات *</Label>
              <Input id="hours" type="number" min={1} placeholder="6" {...register("hours", { required: true, valueAsNumber: true, min: 1 })} />
            </div>
            <div>
              <Label htmlFor="startDate">تاريخ البدء *</Label>
              <Input id="startDate" type="datetime-local" {...register("startDate", { required: true })} />
            </div>
          </div>

          <div className="bg-primary-soft border border-primary/20 rounded-xl p-4 text-sm">
            <strong>ملاحظة:</strong> مبلغ الوظيفة هيتحجز من محفظتك بمجرد قبولك لعامل، ولا يتم تحريره إلا بعد إتمام العمل وتسجيل الـ Check-out.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="accent" size="lg" disabled={create.isPending}>
              {create.isPending ? "جاري النشر..." : "نشر الوظيفة"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>إلغاء</Button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
