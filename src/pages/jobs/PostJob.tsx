import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Briefcase } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { useCreateJob } from "@/hooks/useJobs";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

interface FormValues {
  title: string;
  description: string;
  category: string;
  city: string;
  address: string;
  price: number;
  hours: number;
  startDate: string;
  endDate: string;
  requiredWorkers: number;
}

const categories = ["ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل"];
const cities = ["القاهرة", "الجيزة", "الإسكندرية", "المنصورة"];

const positiveNumber = (message: string) => ({
  required: message,
  valueAsNumber: true,
  min: { value: 1, message },
});

export default function PostJob() {
  const navigate = useNavigate();
  const create = useCreateJob();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      address: "",
      price: 0,
      hours: 1,
      startDate: "",
      endDate: "",
      requiredWorkers: 1,
    },
  });

  const startDate = watch("startDate");

  const onSubmit = async (values: FormValues) => {
    clearErrors("root");
    if (values.endDate && values.startDate && new Date(values.endDate) < new Date(values.startDate)) {
      setError("endDate", { message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء" });
      return;
    }

    try {
      const job = await create.mutateAsync({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        address: values.address.trim(),
        endDate: values.endDate || undefined,
      });
      toast({ title: "تم نشر الوظيفة بنجاح", description: "ستبدأ في استقبال التقديمات قريبا." });
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل نشر الوظيفة.");
      setError("root", { message });
      toast({ title: "فشل نشر الوظيفة", description: message, variant: "destructive" });
    }
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
            <p className="text-muted-foreground">املأ التفاصيل وعمال سندة سيتقدمون في دقائق.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-6 space-y-5" noValidate>
          <Feedback message={errors.root?.message} />

          <div>
            <Label htmlFor="title">عنوان الوظيفة *</Label>
            <Input id="title" placeholder="مثال: نادل لحفل زفاف 6 ساعات" aria-invalid={!!errors.title} {...register("title", { required: "العنوان مطلوب", maxLength: { value: 150, message: "العنوان لا يزيد عن 150 حرف" }, setValueAs: (value) => String(value).trim() })} />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الفئة *</Label>
              <Select onValueChange={(value) => setValue("category", value, { shouldValidate: true })} disabled={create.isPending}>
                <SelectTrigger aria-invalid={!!errors.category}><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("category", { required: "اختر فئة" })} />
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <Label>المدينة *</Label>
              <Select onValueChange={(value) => setValue("city", value, { shouldValidate: true })} disabled={create.isPending}>
                <SelectTrigger aria-invalid={!!errors.city}><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                <SelectContent>{cities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("city", { required: "اختر مدينة" })} />
              {errors.city && <p className="text-destructive text-sm mt-1">{errors.city.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">العنوان التفصيلي *</Label>
            <Input id="address" placeholder="مثال: 12 شارع النيل، الدور الثالث" aria-invalid={!!errors.address} {...register("address", { required: "العنوان مطلوب", maxLength: { value: 250, message: "العنوان لا يزيد عن 250 حرف" }, setValueAs: (value) => String(value).trim() })} />
            {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">وصف العمل *</Label>
            <Textarea id="description" rows={5} placeholder="اشرح المهام المطلوبة وأي شروط خاصة..." aria-invalid={!!errors.description} {...register("description", { required: "الوصف مطلوب", maxLength: { value: 3000, message: "الوصف لا يزيد عن 3000 حرف" }, setValueAs: (value) => String(value).trim() })} />
            {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">السعر (جنيه) *</Label>
              <Input id="price" type="number" min={0} placeholder="500" aria-invalid={!!errors.price} {...register("price", { required: "السعر مطلوب", valueAsNumber: true, min: { value: 0, message: "السعر لا يمكن أن يكون سالبا" } })} />
              {errors.price && <p className="text-destructive text-sm mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="hours">عدد الساعات *</Label>
              <Input id="hours" type="number" min={1} placeholder="6" aria-invalid={!!errors.hours} {...register("hours", positiveNumber("عدد الساعات مطلوب"))} />
              {errors.hours && <p className="text-destructive text-sm mt-1">{errors.hours.message}</p>}
            </div>
            <div>
              <Label htmlFor="requiredWorkers">عدد العمال *</Label>
              <Input id="requiredWorkers" type="number" min={1} placeholder="1" aria-invalid={!!errors.requiredWorkers} {...register("requiredWorkers", positiveNumber("عدد العمال مطلوب"))} />
              {errors.requiredWorkers && <p className="text-destructive text-sm mt-1">{errors.requiredWorkers.message}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">تاريخ البدء *</Label>
              <Input id="startDate" type="datetime-local" aria-invalid={!!errors.startDate} {...register("startDate", { required: "تاريخ البدء مطلوب" })} />
              {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="endDate">تاريخ الانتهاء (اختياري)</Label>
              <Input id="endDate" type="datetime-local" min={startDate || undefined} aria-invalid={!!errors.endDate} {...register("endDate")} />
              {errors.endDate && <p className="text-destructive text-sm mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="bg-primary-soft border border-primary/20 rounded-xl p-4 text-sm">
            <strong>ملاحظة:</strong> مبلغ الوظيفة سيحجز من محفظتك بعد قبول عامل، ولا يتم تحريره إلا بعد إتمام العمل.
          </div>

          <div className="flex gap-3 pt-2">
            <FormSubmitButton variant="accent" size="lg" pending={create.isPending} pendingLabel="جاري النشر...">
              نشر الوظيفة
            </FormSubmitButton>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} disabled={create.isPending}>إلغاء</Button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
