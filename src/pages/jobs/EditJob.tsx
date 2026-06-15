import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Briefcase, Loader2 } from "lucide-react";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useDeleteJob, useJob, useUpdateJob } from "@/hooks/useJobs";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import UserLayout from "@/layouts/UserLayout";
import type { JobStatus, Location } from "@/api/types";

const categories = ["Ø¶ÙŠØ§ÙØ© ÙˆÙØ¹Ø§Ù„ÙŠØ§Øª", "ØªÙ†Ø¸ÙŠÙ", "ØµÙŠØ§Ù†Ø© ÙˆØªØ±ÙƒÙŠØ¨Ø§Øª", "Ù…Ø·Ø§Ø¹Ù…", "ØªØ³ÙˆÙŠÙ‚ Ù…ÙŠØ¯Ø§Ù†ÙŠ", "ØªØµÙˆÙŠØ±", "ØªÙˆØµÙŠÙ„"];
const cities = ["Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©", "Ø§Ù„Ø¬ÙŠØ²Ø©", "Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©", "Ø§Ù„Ù…Ù†ØµÙˆØ±Ø©"];

const editJobSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150, "Title cannot exceed 150 characters."),
  description: z.string().trim().min(1, "Description is required.").max(3000, "Description cannot exceed 3000 characters."),
  category: z.string().trim().min(1, "Choose a category.").max(100, "Category cannot exceed 100 characters."),
  city: z.string().trim().min(1, "Choose a city.").max(250, "City cannot exceed 250 characters."),
  price: z.coerce.number({ message: "Enter a valid salary." }).min(0, "Salary cannot be negative."),
  hours: z.coerce.number({ message: "Enter valid hours." }).min(1, "Duration must be at least 1 hour."),
  startDate: z.string().trim().min(1, "Start date is required."),
  status: z.enum(["open", "in-progress", "completed", "cancelled"]),
});

type FormValues = z.infer<typeof editJobSchema>;

export default function EditJob() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [location, setLocation] = useState<Location>({ address: "", method: "manual" });
  const [generalError, setGeneralError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      price: 0,
      hours: 1,
      startDate: "",
      status: "open",
    },
  });
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = form;

  useEffect(() => {
    if (!job) return;
    reset({
      title: job.title,
      description: job.description,
      category: job.category,
      city: job.city,
      price: job.price,
      hours: job.hours,
      startDate: job.startDate?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
      status: job.status,
    });
    setLocation({
      address: job.address,
      latitude: job.latitude,
      longitude: job.longitude,
      method: job.method ?? "manual",
    });
    setGeneralError("");
  }, [job, reset]);

  const onSubmit = async (values: FormValues) => {
    if (updateJob.isPending) return;
    setGeneralError("");
    if (!location.address) {
      const message = "Detailed address is required.";
      setGeneralError(message);
      toast({ title: "Address required", description: message, variant: "destructive" });
      return;
    }

    try {
      await updateJob.mutateAsync({
        id,
        payload: {
          ...values,
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category.trim(),
          city: values.city.trim(),
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          method: location.method,
        },
      });
      toast({ title: "Job updated", description: "Your changes were saved." });
      navigate(`/jobs/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not update the job. Please try again.");
      setGeneralError(message);
      toast({ title: "Job update failed", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleteJob.isPending) return;
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setGeneralError("");
    try {
      await deleteJob.mutateAsync(id);
      toast({ title: "Job deleted", description: "The job was removed." });
      navigate("/my-jobs");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not delete the job. Please try again.");
      setGeneralError(message);
      toast({ title: "Job delete failed", description: message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
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
          <h1 className="mb-2 font-heading text-2xl font-extrabold">Job not found</h1>
          <Button type="button" className="mt-4" onClick={() => navigate("/my-jobs")}>Back to my jobs</Button>
        </div>
      </UserLayout>
    );
  }

  if (user && job.employerId !== user.id && user.role !== "admin") {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-2 font-heading text-2xl font-extrabold">Not allowed</h1>
          <p className="text-muted-foreground">You are not the owner of this job.</p>
          <Button type="button" className="mt-4" onClick={() => navigate(`/jobs/${id}`)}>Back to job</Button>
        </div>
      </UserLayout>
    );
  }

  const canEditStatus = job.status === "open";

  return (
    <UserLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-2 flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold md:text-3xl">Edit job</h1>
            <p className="text-sm text-muted-foreground">Update details or delete this job.</p>
          </div>
        </div>

        {job.status === "in-progress" && (
          <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
            This job is in progress. Editing is limited.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8" noValidate>
          <div>
            <Label htmlFor="title">Job title</Label>
            <Input id="title" disabled={updateJob.isPending || deleteJob.isPending} aria-invalid={!!errors.title} {...register("title")} />
            <Feedback className="mt-1 justify-start text-start">{errors.title?.message}</Feedback>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={watch("category")} disabled={updateJob.isPending || deleteJob.isPending} onValueChange={(value) => setValue("category", value, { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("category")} />
              <Feedback className="mt-1 justify-start text-start">{errors.category?.message}</Feedback>
            </div>
            <div>
              <Label>City</Label>
              <Select value={watch("city")} disabled={updateJob.isPending || deleteJob.isPending} onValueChange={(value) => setValue("city", value, { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose city" /></SelectTrigger>
                <SelectContent>{cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
              </Select>
              <input type="hidden" {...register("city")} />
              <Feedback className="mt-1 justify-start text-start">{errors.city?.message}</Feedback>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <LocationPicker
              value={location}
              onChange={setLocation}
              addressError={!location.address ? "Detailed address is required." : undefined}
            />
          </div>

          <div>
            <Label htmlFor="description">Work description</Label>
            <Textarea id="description" rows={5} disabled={updateJob.isPending || deleteJob.isPending} aria-invalid={!!errors.description} {...register("description")} />
            <Feedback className="mt-1 justify-start text-start">{errors.description?.message}</Feedback>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="price">Salary</Label>
              <Input id="price" type="number" min={0} disabled={updateJob.isPending || deleteJob.isPending} {...register("price")} />
              <Feedback className="mt-1 justify-start text-start">{errors.price?.message}</Feedback>
            </div>
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" type="number" min={1} disabled={updateJob.isPending || deleteJob.isPending} {...register("hours")} />
              <Feedback className="mt-1 justify-start text-start">{errors.hours?.message}</Feedback>
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="datetime-local" disabled={updateJob.isPending || deleteJob.isPending} {...register("startDate")} />
              <Feedback className="mt-1 justify-start text-start">{errors.startDate?.message}</Feedback>
            </div>
          </div>

          {canEditStatus && (
            <div>
              <Label>Status</Label>
              <Select value={watch("status")} disabled={updateJob.isPending || deleteJob.isPending} onValueChange={(value) => setValue("status", value as JobStatus, { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register("status")} />
            </div>
          )}

          <Feedback>{generalError}</Feedback>

          <div className="flex flex-wrap gap-3 pt-2">
            <FormSubmitButton
              variant="accent"
              size="lg"
              disabled={!isDirty || deleteJob.isPending}
              isPending={updateJob.isPending}
              loadingText="Saving..."
              className={cn(!isDirty && "opacity-60")}
            >
              Save changes
            </FormSubmitButton>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} disabled={updateJob.isPending || deleteJob.isPending}>
              Cancel
            </Button>
            {job.status === "open" && (
              <Button type="button" variant="destructive" size="lg" className="ms-auto" onClick={handleDelete} disabled={updateJob.isPending || deleteJob.isPending}>
                {deleteJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete job
              </Button>
            )}
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
