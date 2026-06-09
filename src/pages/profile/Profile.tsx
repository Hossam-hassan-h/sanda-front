import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, ShieldCheck, Calendar, Star, Briefcase, Pencil } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { mockUsers } from "@/lib/mock/data";
import { useRatings } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import EditProfileModal from "@/components/EditProfileModal";
import { toast } from "@/hooks/use-toast";
import type { User } from "@/api/types";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User>(() => {
    if (!id && authUser) return authUser;
    if (authUser && authUser.id === id) {
      const stored = localStorage.getItem("sanda_user");
      return stored ? JSON.parse(stored) : authUser;
    }
    return mockUsers.find((u) => u.id === id) ?? mockUsers[0];
  });
  const { data: ratings } = useRatings(profileUser.id);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (!id && authUser) {
      setProfileUser(authUser);
    } else if (authUser && authUser.id === id) {
      const stored = localStorage.getItem("sanda_user");
      setProfileUser(stored ? JSON.parse(stored) : authUser);
    } else {
      setProfileUser(mockUsers.find((u) => u.id === id) ?? mockUsers[0]);
    }
  }, [id, authUser]);

  const isOwnProfile = authUser !== null && authUser.id === profileUser.id;

  const handleProfileUpdate = (updated: Partial<User>) => {
    const merged = { ...profileUser, ...updated };
    localStorage.setItem("sanda_user", JSON.stringify(merged));
    setProfileUser(merged);
    toast({
      title: "تم الحفظ",
      description: "تم تحديث بيانات ملفك الشخصي بنجاح.",
    });
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileUser.avatar} />
              <AvatarFallback className="text-2xl">{profileUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-heading font-extrabold text-2xl md:text-3xl">{profileUser.name}</h1>
                {profileUser.isVerified && (
                  <Badge className="bg-success/10 text-success border-success/20">
                    <ShieldCheck className="h-3 w-3 me-1" /> موثق
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground mb-3">
                {profileUser.role === "worker" ? "عامل" : profileUser.role === "employer" ? "صاحب عمل" : "مسؤول"}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profileUser.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profileUser.city}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> عضو منذ {new Date(profileUser.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
                {profileUser.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" /> {profileUser.rating.toFixed(1)} ({profileUser.ratingsCount} تقييم)
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile ? (
              <Button onClick={() => setEditModalOpen(true)} className="gap-2">
                <Pencil className="w-4 h-4" />
                تعديل الملف الشخصي
              </Button>
            ) : (
              <Button variant="outline">مراسلة</Button>
            )}
          </div>

          {profileUser.bio && <p className="text-foreground/80 mt-6 pt-6 border-t border-border leading-relaxed">{profileUser.bio}</p>}
        </div>

        {/* Skills */}
        {profileUser.skills && profileUser.skills.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> المهارات</h2>
            <div className="flex flex-wrap gap-2">
              {profileUser.skills.map((s) => <Badge key={s} variant="outline" className="px-3 py-1">{s}</Badge>)}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="وظائف منفّذة" value="32" />
          <StatBox label="معدل الالتزام" value="98%" />
          <StatBox label="التقييم" value={profileUser.rating?.toFixed(1) ?? "—"} />
        </div>

        {/* Ratings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg mb-4">آراء العملاء ({ratings?.length ?? 0})</h2>
          <div className="space-y-5">
            {ratings?.map((r) => (
              <div key={r.id} className="flex gap-3 pb-5 border-b border-border last:border-0 last:pb-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={r.reviewer.avatar} />
                  <AvatarFallback>{r.reviewer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{r.reviewer.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-EG")}</span>
                  </div>
                  <StarRating value={r.rating} />
                  <p className="text-sm text-foreground/80 mt-2">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={profileUser}
        onSave={handleProfileUpdate}
      />
    </UserLayout>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="font-heading font-extrabold text-2xl text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
