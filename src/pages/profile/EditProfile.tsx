import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, User } from "lucide-react";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import SkillsInput from "@/components/SkillsInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { applyApiErrorsToForm } from "@/lib/api-error";
import UserLayout from "@/layouts/UserLayout";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  city: z.string().trim().max(200, "City cannot exceed 200 characters.").optional(),
  bio: z.string().trim().max(500, "Bio cannot exceed 500 characters.").optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, updateUser, switchRole } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [generalError, setGeneralError] = useState("");

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      city: user?.city || "",
    },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  if (!user) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8 text-center text-muted-foreground">
          Please sign in to edit your profile.
        </div>
      </UserLayout>
    );
  }

  const handleSave = async (values: ProfileValues) => {
    setGeneralError("");
    try {
      const updatedUser = await authApi.updateProfile(user.id, {
        name: values.name.trim(),
        bio: values.bio?.trim() || undefined,
        city: values.city?.trim() || undefined,
        skills: user.role === "worker" ? skills : [],
      });
      updateUser(updatedUser);
      toast({ title: "Profile updated", description: "Your profile changes were saved." });
      navigate(`/profile/${user.id}`);
    } catch (error) {
      const message = applyApiErrorsToForm(error, form, "Could not update your profile. Please try again.");
      setGeneralError(message);
      toast({ title: "Profile update failed", description: message, variant: "destructive" });
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8 text-right" dir="rtl">
        <div className="mb-6 flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isSubmitting}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit profile</h1>
            <p className="text-sm text-muted-foreground">Update your personal and professional information.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <User className="h-5 w-5 text-primary" />
              Basic details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleSave)} className="space-y-5" noValidate>
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold">Full name</Label>
                <Input id="name" autoComplete="name" disabled={isSubmitting} aria-invalid={!!errors.name} {...register("name")} />
                <Feedback className="mt-1 justify-start text-start">{errors.name?.message}</Feedback>
              </div>

              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                <Input id="city" disabled={isSubmitting} placeholder="Cairo, Giza, Alexandria..." aria-invalid={!!errors.city} {...register("city")} />
                <Feedback className="mt-1 justify-start text-start">{errors.city?.message}</Feedback>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio" className="text-xs font-semibold">Bio</Label>
                <Textarea
                  id="bio"
                  disabled={isSubmitting}
                  placeholder="Write a short bio about your skills or services..."
                  className="h-24 resize-none"
                  maxLength={500}
                  aria-invalid={!!errors.bio}
                  {...register("bio")}
                />
                <Feedback className="mt-1 justify-start text-start">{errors.bio?.message}</Feedback>
              </div>

              {user.role === "worker" && (
                <div className="space-y-1 border-t pt-4">
                  <Label className="mb-2 block text-xs font-bold">Skills</Label>
                  <SkillsInput value={skills} onChange={setSkills} />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <span className="block text-xs font-semibold">Development role switch</span>
                  <span className="text-[10px] text-muted-foreground">Available outside production for feature testing.</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant={user.role === "worker" ? "default" : "outline"} size="sm" disabled={isSubmitting} onClick={() => { switchRole("worker"); window.location.reload(); }}>
                    Worker
                  </Button>
                  <Button type="button" variant={user.role === "employer" ? "default" : "outline"} size="sm" disabled={isSubmitting} onClick={() => { switchRole("employer"); window.location.reload(); }}>
                    Employer
                  </Button>
                </div>
              </div>

              <Feedback>{generalError}</Feedback>

              <div className="flex gap-3 pt-2">
                <FormSubmitButton className="flex-1" isPending={isSubmitting} loadingText="Saving...">
                  Save changes
                </FormSubmitButton>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
