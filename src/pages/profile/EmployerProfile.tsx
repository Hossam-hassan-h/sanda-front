import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ShieldCheck, Calendar, Star, Building, MessageSquare, ArrowLeft } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RatingStars from "@/components/RatingStars";
import { mockUsers, mockJobs } from "@/lib/mock/data";
import { useUserRatings } from "@/hooks/useRatings";

export default function EmployerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === id) ?? mockUsers[1]; // default employer u2
  const { data: ratings, isLoading } = useUserRatings(user.id);

  // Filter jobs posted by this employer
  const postedJobs = mockJobs.filter((j) => j.employerId === user.id);

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl text-right" dir="rtl">
        {/* Back navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ملف صاحب العمل</h1>
            <p className="text-sm text-muted-foreground">عرض سجل الوظائف والتقييمات للشركة</p>
          </div>
        </div>

        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-heading font-extrabold text-2xl md:text-3xl">{user.name}</h2>
                {user.isVerified && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    <span>حساب موثق</span>
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-sm mb-3">شركة / صاحب عمل معتمد في سندة</div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {user.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" /> {user.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" /> عضو منذ {" "}
                  {new Date(user.createdAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
                {user.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />{" "}
                    {user.rating.toFixed(1)} ({user.ratingsCount} تقييم)
                  </span>
                )}
              </div>
            </div>
            <Button onClick={() => navigate("/chat")} className="gap-1.5 py-5 font-bold">
              <MessageSquare className="w-4 h-4" />
              مراسلة
            </Button>
          </div>

          {user.bio && (
            <p className="text-foreground/80 mt-6 pt-6 border-t border-border leading-relaxed text-sm">
              {user.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="font-heading font-extrabold text-2xl text-primary">{postedJobs.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">وظائف معلنة</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="font-heading font-extrabold text-2xl text-primary">
              {postedJobs.filter((j) => j.status === "in-progress").length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">وظائف نشطة حالياً</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="font-heading font-extrabold text-2xl text-primary">
              {user.rating?.toFixed(1) || "—"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">تقييم عمالة</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Jobs List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" /> الوظائف المتاحة حالياً ({postedJobs.filter(j => j.status === "open").length})
              </h3>
              <div className="space-y-4">
                {postedJobs.filter(j => j.status === "open").map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="p-4 border rounded-xl hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center bg-white"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{job.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.city} • {job.hours} ساعات عمل
                      </p>
                    </div>
                    <span className="font-black text-sm text-primary">{job.price} جنيه</span>
                  </div>
                ))}
                {postedJobs.filter(j => j.status === "open").length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    لا توجد وظائف مفتوحة حالياً.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ratings Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 h-fit">
            <h3 className="font-heading font-bold text-base mb-4">آراء الموظفين ({ratings?.length || 0})</h3>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-xs text-muted-foreground text-center">جاري تحميل الآراء...</p>
              ) : ratings && ratings.length > 0 ? (
                ratings.map((r) => (
                  <div key={r.id} className="pb-3 border-b border-border last:border-0 last:pb-0 text-right">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs">{r.reviewer.name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <RatingStars rating={r.rating} size={12} />
                    <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  لا توجد تقييمات بعد.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
