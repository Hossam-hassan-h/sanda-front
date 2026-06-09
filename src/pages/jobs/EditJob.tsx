import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/components/LocationPicker";
import UserLayout from "@/layouts/UserLayout";
import { useJob, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { JobStatus, Location } from "@/api/types";

interface FormValues {
  title: string;
  description: string;
  category: string;
  city: string;
  price: number;
  hours: number;
  startDate: string;
  status: JobStatus;
}

const categories = ["ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل"];
const cities = ["القاهرة", "الجيزة", "الإسكندرية", "المنصورة"];

export default function EditJob() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm<FormValues>();

  const [location, setLocation] = useState<Location>({ address: "", method: "manual" });

  // Hydrate form once job is loaded
  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        category: job.category,
        city: job.city,
        price: job.price,
        hours: job.hours,
        startDate: job.startDate?.slice(0, 16) ?? "",
        status: job.status,
      });
      setLocation({
        address: job.address,
        latitude: job.latitude,
        longitude: job.longitude,
        method: job.method ?? "manual",
      });
    }
  }, [job, reset]);

  // Authorisation — only the employer who owns the job may edit
  if (!isLoading && job && user && job.employerId !== user.id && user.role !== "admin") {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading font-extrabold text-2xl mb-2">مش مسموح</h1>
          <p className="text-muted-foreground">إنت مش صاحب الوظيفة دي.</p>
          <Button className="mt-4" onClick={() => navigate(`/jobs/${id}`)}>
            الرجوع للوظيفة
          </Button>
        </div>
      </UserLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    if (!location.address) {
      toast({ title: "العنوان التفصيلي مطلوب", variant: "destructive" });
      return;
    }
    try {
      await updateJob.mutateAsync({
        id,
        payload: {
          ...values,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          method: location.method,
        },
      });
      toast({ title: "تم حفظ التعديلات" });
      navigate(`/jobs/${id}`);
    } catch {
      toast({ title: "فشل حفظ التعديلات", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("متأكد إنك عايز تلغي الوظيفة؟ مش هتقدر ترجّعها.")) return;
    try {
      await deleteJob.mutateAsync(id);
      toast({ title: "تم إلغاء الوظيفة" });
      navigate("/my-jobs");
    } catch {
      toast({ title: "فشل إلغاء الوظيفة", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-10 max-w-3xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UserLayout>
    );
  }

  if (!job) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading font-extrabold text-2xl mb-2">الوظيفة مش موجودة</h1>
          <Button className="mt-4" onClick={() => navigate("/my-jobs")}>
            الرجوع لوظائفي
          </Button>
        </div>
      </UserLayout>
    );
  }

  const canEditStatus = job.status === "open" || job.status === "cancelled";

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl">تعديل الوظيفة</h1>
            <p className="text-muted-foreground text-sm">حدّث التفاصيل أو ألغِ الوظيفة لو في تغييرات.</p>
          </div>
        </div>

        {job.status === "in-progress" && (
          <div className="mt-4 bg-warning/10 border border-warning/20 text-warning rounded-xl p-3 text-sm">
            الوظيفة جارية التنفيذ — التعديلات محدودة. الإلغاء متاح فقط للوظائف المفتوحة.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-6 space-y-5">
          <div>
            <Label htmlFor="title">عنوان الوظيفة *</Label>
            <Input id="title" {...register("title", { required: "العنوان مطلوب" })} />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الفئة *</Label>
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v, { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("category", { required: "اختر فئة" })} />
            </div>
            <div>
              <Label>المدينة *</Label>
              <Select value={watch("city")} onValueChange={(v) => setValue("city", v, { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("city", { required: "اختر مدينة" })} />
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
            <Textarea id="description" rows={5} {...register("description", { required: "الوصف مطلوب" })} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">السعر (جنيه) *</Label>
              <Input id="price" type="number" min={50} {...register("price", { required: true, valueAsNumber: true, min: 50 })} />
            </div>
            <div>
              <Label htmlFor="hours">عدد الساعات *</Label>
              <Input id="hours" type="number" min={1} {...register("hours", { required: true, valueAsNumber: true, min: 1 })} />
            </div>
            <div>
              <Label htmlFor="startDate">تاريخ البدء *</Label>
              <Input id="startDate" type="datetime-local" {...register("startDate", { required: true })} />
            </div>
          </div>

          {canEditStatus && (
            <div>
              <Label>الحالة</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as JobStatus, { shouldDirty: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">مفتوحة للتقديم</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register("status")} />
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={updateJob.isPending || !isDirty}
              className={cn(!isDirty && "opacity-60")}
            >
              {updateJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              حفظ التعديلات
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            {job.status === "open" && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="ms-auto"
                onClick={handleDelete}
                disabled={deleteJob.isPending}
              >
                {deleteJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                إلغاء الوظيفة
              </Button>
            )}
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
