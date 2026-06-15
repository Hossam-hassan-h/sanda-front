import { useState } from "react";
import { Languages, Key } from "lucide-react";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import SettingsLayout from "@/layouts/SettingsLayout";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState("ar");

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      if (user?.id) await authApi.updatePassword(user.id, { currentPassword, newPassword });
      toast({ title: "Password changed", description: "Your account password was updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not change password. Check your current password.");
      setPasswordError(message);
      toast({ title: "Password change failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="w-full text-right" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update account preferences and privacy.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Languages className="h-4.5 w-4.5 text-primary" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <span className="text-xs font-semibold">Application display language</span>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button size="sm" variant={lang === "ar" ? "default" : "outline"} type="button" onClick={() => setLang("ar")}>
                  العربية
                </Button>
                <Button size="sm" variant={lang === "en" ? "default" : "outline"} type="button" onClick={() => setLang("en")}>
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Key className="h-4.5 w-4.5 text-primary" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="currentPassword" className="text-xs">Current password</label>
                  <PasswordInput id="currentPassword" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={saving} required />
                </div>
                <div className="space-y-1">
                  <label htmlFor="newPassword" className="text-xs">New password</label>
                  <PasswordInput id="newPassword" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={saving} required />
                </div>
                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-xs">Confirm new password</label>
                  <PasswordInput id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={saving} required />
                </div>
                <Feedback>{passwordError}</Feedback>
                <FormSubmitButton size="sm" className="mt-2 w-full" isPending={saving} loadingText="Updating...">
                  Update password
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
