import { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, Calendar, Users, Star, ShieldCheck, MessageCircle, ArrowLeft, QrCode, Loader2 } from "lucide-react";
import MapView from "@/components/MapView";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useJob, useApplyToJob, useApplicants } from "@/hooks/useJobs";
import { useJobAssignments, useMyAssignments } from "@/hooks/useJobAssignments";
import { useCreateConversation } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeoCoordinates } from "@/lib/geolocation";

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id!);
  const { user } = useAuth();
  const apply = useApplyToJob();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const isWorker = user?.role === "worker";
  const isEmployer = user?.role === "employer";

  const { data: applicants } = useApplicants(id ?? "");
  // Fetch assignments according to user role to avoid 403 errors
  const { data: employerAssignments } = useJobAssignments(isEmployer ? (id ?? "") : "");
  const { data: workerAssignments } = useMyAssignments();

  const createConversation = useCreateConversation();

  const handleMessage = useCallback(async () => {
    if (!job || !user) return;
    const myAssignments = isEmployer ? (employerAssignments ?? []) : (workerAssignments ?? []);
    const isJobOwner = isEmployer && job.employerId === user.id;
    const assignment = myAssignments.find((a) => {
      if (isJobOwner) return a.jobId === job.id && a.workerId === job.workerId;
      return a.jobId === job.id && a.workerId === user.id;
    });
    if (!assignment) {
      toast({ title: "لم يتم العثور على مهمة نشطة", description: "لا توجد مهمة مرتبطة بهذه الوظيفة للمراسلة", variant: "destructive" });
      return;
    }
    try {
      const conversation = await createConversation.mutateAsync(assignment.id);
      const convId = conversation?.id ?? conversation?._id ?? "";
      navigate(`/chat?conversation=${convId}`);
    } catch {
      toast({ title: "فشل فتح المحادثة", variant: "destructive" });
    }
  }, [job, user, isEmployer, employerAssignments, workerAssignments, createConversation, navigate]);

  const handleApply = async () => {
    if (!job) return;
    try {
      await apply.mutateAsync({ jobId: job.id, message });
      toast({ title: "تم إرسال طلبك", description: "صاحب العمل هيتواصل معاك قريباً." });
      setOpen(false);
      setMessage("");
    } catch {
      toast({ title: "فشل إرسال الطلب", variant: "destructive" });
    }
  };

  if (isLoading) return <UserLayout><div className="container mx-auto px-4 py-10"><Skeleton className="h-96 rounded-xl" /></div></UserLayout>;
  if (!job) return <UserLayout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">الوظيفة غير موجودة.</div></UserLayout>;

  const isJobOwner = isEmployer && job.employerId === user?.id;
  const isAcceptedWorker = isWorker && job.workerId === user?.id;

  const hasCoords = job.latitude && job.longitude;
  const mapMarkers = hasCoords ? [{
    id: job.id,
    lat: job.latitude!,
    lng: job.longitude!,
    title: job.address,
    subtitle: job.city,
  }] : [];
  const mapCenter: GeoCoordinates | undefined = hasCoords
    ? { lat: job.latitude!, lng: job.longitude!, timestamp: 0 }
    : undefined;

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 rotate-180" /> الرجوع للوظائف
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">{job.category}</Badge>
                  <h1 className="font-heading font-extrabold text-2xl md:text-3xl">{job.title}</h1>
                </div>
                <div className="text-end">
                  <div className="font-heading font-extrabold text-3xl text-primary">{job.price}</div>
                  <div className="text-sm text-muted-foreground">جنيه إجمالي</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-y border-border py-4 my-4">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.city} — {job.address}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {job.hours} ساعات</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(job.startDate).toLocaleDateString("ar-EG", { dateStyle: "medium" })}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {isJobOwner ? (applicants?.length ?? job.applicantsCount) : job.applicantsCount} متقدم</span>
              </div>

              <h2 className="font-heading font-bold text-lg mb-2">الوصف</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Map */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading font-bold text-lg mb-3">الموقع</h2>
              {job.latitude && job.longitude ? (
                <MapView
                  markers={mapMarkers}
                  center={mapCenter}
                  zoom={15}
                  height={280}
                />
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-primary" />
                    <div>{job.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading font-bold mb-4">صاحب العمل</h3>
              <Link to={`/profile/${job.employer.id}`} className="flex items-center gap-3 hover:opacity-80">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={job.employer.avatar} />
                  <AvatarFallback>{job.employer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{job.employer.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    {job.employer.rating?.toFixed(1) ?? "0.0"} تقييم
                  </div>
                </div>
              </Link>
            </div>

            <div className="bg-primary-soft border border-primary/20 rounded-xl p-5 flex gap-3">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
              <div className="text-sm">
                <div className="font-semibold mb-1">دفع آمن بنظام الضمان</div>
                <div className="text-muted-foreground">المبلغ هيتحجز ولا يتسلّم إلا بعد ما تخلص الشغل بنجاح.</div>
              </div>
            </div>

            {isWorker && job.status === "open" ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="accent" size="lg" className="w-full">تقديم على الوظيفة</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تقديم على: {job.title}</DialogTitle>
                  </DialogHeader>
                  <div>
                    <label className="text-sm font-medium mb-2 block">رسالة لصاحب العمل (اختياري)</label>
                    <Textarea
                      placeholder="عرّف نفسك واشرح ليه أنت مناسب للوظيفة..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button onClick={handleApply} disabled={apply.isPending}>
                      {apply.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : !user ? (
              <Button variant="accent" size="lg" className="w-full" asChild>
                <Link to="/login">سجّل دخول للتقديم</Link>
              </Button>
            ) : user.role === "employer" && job.employerId === user.id ? (
              <Button variant="default" size="lg" className="w-full" asChild>
                <Link to={`/jobs/${job.id}/applicants`}>مشاهدة المتقدمين ({applicants?.length ?? job.applicantsCount})</Link>
              </Button>
            ) : null}

            {/* أزرار للمستخدمين المقبولين في الوظيفة */}
            {(isAcceptedWorker || isJobOwner) && job.status === "in-progress" && (
              <div className="space-y-2">
                <Button variant="accent" size="lg" className="w-full" asChild>
                  <Link to={`/jobs/${job.id}/active`}>
                    <QrCode className="h-4 w-4" /> 
                    {isAcceptedWorker ? "تسجيل الحضور بالـ QR" : "عرض QR Code والحضور"}
                  </Link>
                </Button>
                {isJobOwner && (
                  <Button variant="default" size="lg" className="w-full" asChild>
                    <Link to={`/jobs/${job.id}/assignments`}>
                      إدارة الحضور
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleMessage}
                  disabled={createConversation.isPending}
                >
                  {createConversation.isPending ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 ml-2" />
                  )}
                  مراسلة {isAcceptedWorker ? "صاحب العمل" : "العامل"}
                </Button>
              </div>
            )}

            {/* شات فقط لو مكتملة */}
            {(isAcceptedWorker || isJobOwner) && job.status !== "in-progress" && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleMessage}
                disabled={createConversation.isPending}
              >
                {createConversation.isPending ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 ml-2" />
                )}
                مراسلة {isAcceptedWorker ? "صاحب العمل" : "العامل"}
              </Button>
            )}
          </aside>
        </div>
      </div>
    </UserLayout>
  );
}
