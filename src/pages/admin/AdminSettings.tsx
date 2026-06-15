import { useState } from "react";
import { Key } from "lucide-react";

import { authApi } from "@/api/auth";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

export default function AdminSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

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
      toast({ title: "Password changed", description: "Admin password was updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not change password. Check the current password.");
      setPasswordError(message);
      toast({ title: "Password change failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-extrabold md:text-3xl">Settings</h1>
          <p className="text-muted-foreground">Change password and review account settings.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Key className="h-4.5 w-4.5 text-primary" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
              <div>
                <label htmlFor="adminCurrentPassword" className="mb-1 block text-sm font-medium">Current password</label>
                <PasswordInput id="adminCurrentPassword" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={saving} required placeholder="••••••••" />
              </div>
              <div>
                <label htmlFor="adminNewPassword" className="mb-1 block text-sm font-medium">New password</label>
                <PasswordInput id="adminNewPassword" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={saving} required placeholder="At least 8 characters" />
              </div>
              <div>
                <label htmlFor="adminConfirmPassword" className="mb-1 block text-sm font-medium">Confirm new password</label>
                <PasswordInput id="adminConfirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={saving} required placeholder="Repeat the new password" />
              </div>
              <Feedback>{passwordError}</Feedback>
              <FormSubmitButton isPending={saving} loadingText="Saving...">
                Save changes
              </FormSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Account information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">Admin</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
