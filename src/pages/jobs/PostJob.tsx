import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase } from "lucide-react";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCreateJob } from "@/hooks/useJobs";
import { applyApiErrorsToForm } from "@/lib/api-error";
import UserLayout from "@/layouts/UserLayout";

const categories = ["Ø¶ÙŠØ§ÙØ© ÙˆÙØ¹Ø§Ù„ÙŠØ§Øª", "ØªÙ†Ø¸ÙŠÙ", "ØµÙŠØ§Ù†Ø© ÙˆØªØ±ÙƒÙŠØ¨Ø§Øª", "Ù…Ø·Ø§Ø¹Ù…", "ØªØ³ÙˆÙŠÙ‚ Ù…ÙŠØ¯Ø§Ù†ÙŠ", "ØªØµÙˆÙŠØ±", "ØªÙˆØµÙŠÙ„"];
const cities = ["Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©", "Ø§Ù„Ø¬ÙŠØ²Ø©", "Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©", "Ø§Ù„Ù…Ù†ØµÙˆØ±Ø©"];

const jobSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150, "Title cannot exceed 150 characters."),
  description: z.string().trim().min(1, "Description is required.").max(3000, "Description cannot exceed 3000 characters."),
  category: z.string().trim().min(1, "Choose a category.").max(100, "Category cannot exceed 100 characters."),
  city: z.string().trim().min(1, "Choose a city.").max(250, "City cannot exceed 250 characters."),
  address: z.string().trim().min(1, "Address is required.").max(250, "Address cannot exceed 250 characters."),
  price: z.coerce.number({ message: "Enter a valid salary." }).min(0, "Salary cannot be negative."),
  hours: z.coerce.number({ message: "Enter valid hours." }).min(1, "Duration must be at least 1 hour."),
  startDate: z.string().trim().min(1, "Start date is required."),
  requiredWorkers: z.coerce.number({ message: "Enter a valid worker count." }).int("Worker count must be a whole number.").min(1, "At least one worker is required."),
});

type FormValues = z.infer<typeof jobSchema>;

export default function PostJob() {
  const navigate = useNavigate();
  const create = useCreateJob();
  const form = useForm<FormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      address: "",
      price: 0,
      hours: 1,
      startDate: "",
      requiredWorkers: 1,
    },
  });
  const { register, handleSubmit, setValue, formState: { errors } } = form;

  const onSubmit = async (values: FormValues) => {
    if (create.isPending) return;
    try {
      const job = await create.mutateAsync({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category.trim(),
        city: values.city.trim(),
        address: values.address.trim(),
      });
      toast({ title: "Job created", description: "You can now receive applications." });
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Could not create the job. Please review the form.");
      toast({ title: "Job creation failed", description: message, variant: "destructive" });
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold md:text-3xl">Create a new job</h1>
            <p className="text-muted-foreground">Fill in the details and workers can apply soon.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8" noValidate>
          <div>
            <Label htmlFor="title">Job title</Label>
            <Input id="title" placeholder="Example: event waiter for 6 hours" aria-invalid={!!errors.title} disabled={create.isPending} {...register("title")} />
            <Feedback className="mt-1 justify-start text-start">{errors.title?.message}</Feedback>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select disabled={create.isPending} onValueChange={(value) => setValue("category", value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("category")} />
              <Feedback className="mt-1 justify-start text-start">{errors.category?.message}</Feedback>
            </div>
            <div>
              <Label>City</Label>
              <Select disabled={create.isPending} onValueChange={(value) => setValue("city", value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("city")} />
              <Feedback className="mt-1 justify-start text-start">{errors.city?.message}</Feedback>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Detailed address</Label>
            <Input id="address" placeholder="Street, building, floor" aria-invalid={!!errors.address} disabled={create.isPending} {...register("address")} />
            <Feedback className="mt-1 justify-start text-start">{errors.address?.message}</Feedback>
          </div>

          <div>
            <Label htmlFor="description">Work description</Label>
            <Textarea id="description" rows={5} placeholder="Explain tasks, uniform, and special requirements..." aria-invalid={!!errors.description} disabled={create.isPending} {...register("description")} />
            <Feedback className="mt-1 justify-start text-start">{errors.description?.message}</Feedback>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="price">Salary</Label>
              <Input id="price" type="number" min={0} disabled={create.isPending} {...register("price")} />
              <Feedback className="mt-1 justify-start text-start">{errors.price?.message}</Feedback>
            </div>
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" type="number" min={1} disabled={create.isPending} {...register("hours")} />
              <Feedback className="mt-1 justify-start text-start">{errors.hours?.message}</Feedback>
            </div>
            <div>
              <Label htmlFor="requiredWorkers">Workers</Label>
              <Input id="requiredWorkers" type="number" min={1} disabled={create.isPending} {...register("requiredWorkers")} />
              <Feedback className="mt-1 justify-start text-start">{errors.requiredWorkers?.message}</Feedback>
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="datetime-local" disabled={create.isPending} {...register("startDate")} />
              <Feedback className="mt-1 justify-start text-start">{errors.startDate?.message}</Feedback>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4 text-sm">
            <strong>Note:</strong> The job amount is held in escrow after you accept a worker and released after checkout.
          </div>

          <div className="flex gap-3 pt-2">
            <FormSubmitButton variant="accent" size="lg" isPending={create.isPending} loadingText="Publishing...">
              Publish job
            </FormSubmitButton>
            <button type="button" className="h-11 rounded-md border-2 border-primary bg-background px-8 text-sm font-medium text-primary hover:bg-primary/5" onClick={() => navigate(-1)} disabled={create.isPending}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
