import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QrCode, Camera, CheckCircle2, Clock, type LucideIcon } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJob } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import QRScanner from "@/components/QRScanner";

export default function ActiveJob() {
  const { id } = useParams<{ id: string }>();
  const { data: job } = useJob(id!);
  const { user } = useAuth();
  
  // حالة للتحكم في ظهور الكاميرا للعامل
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!job) {
    return (
      <UserLayout>
        <div className="container py-20 text-center">جاري التحميل...</div>
      </UserLayout>
    );
  }

  const isEmployer = user?.role === "employer";
  const isWorker = user?.role === "worker";

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <Badge className="bg-warning/10 text-warning border-warning/20 mb-3">قيد التنفيذ</Badge>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">{job.title}</h1>
        <p className="text-muted-foreground mb-8">
          {isEmployer ? "اعرض الكود للعامل ليسجل حضوره" : "امسح الكود لتأكيد حضورك واستلام أجرك بعد الانتهاء"}
        </p>

        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          {isEmployer ? (
            <>
              <div className="mx-auto w-64 h-64 bg-foreground rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="h-40 w-40 text-background" />
              </div>
              <h2 className="font-heading font-bold text-xl mb-1">كود الـ Check-in</h2>
              <p className="text-muted-foreground text-sm mb-6">صالح طوال مدة الوظيفة. اطلب من العامل مسحه عند الوصول والمغادرة.</p>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm">JOB:{job.id}</div>
            </>
          ) : (
            <>
              {isScannerOpen ? (
                <div className="space-y-4">
                  <QRScanner jobId={job.id} />
                  <Button variant="ghost" onClick={() => setIsScannerOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-32 h-32 rounded-full bg-primary-soft flex items-center justify-center mb-6">
                    <Camera className="h-16 w-16 text-primary" />
                  </div>
                  <h2 className="font-heading font-bold text-xl mb-2">مسح كود الحضور</h2>
                  <p className="text-muted-foreground text-sm mb-6">اضغط الزر لفتح الكاميرا ومسح الـ QR من صاحب العمل.</p>
                  <Button variant="accent" size="lg" onClick={() => setIsScannerOpen(true)}>
                    <Camera className="h-5 w-5 ml-2" /> فتح الكاميرا
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* سجل الحضور */}
        <div className="mt-6 bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-3">سجل الحضور</h3>
          <div className="space-y-3">
            {/* يفضل مستقبلاً جلب البيانات ديناميكياً من السجل الفعلي للوظيفة */}
            <Row icon={CheckCircle2} color="success" title="Check-in" time="٠٩:٠٠ ص" done />
            <Row icon={Clock} color="muted" title="Check-out" time="بانتظار..." />
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" asChild>
            <Link to="/chat">انتقل للمحادثة</Link>
          </Button>
        </div>
      </div>
    </UserLayout>
  );
}

const colorMap: Record<string, string> = {
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
};

function Row({ icon: Icon, title, time, done, color }: { icon: LucideIcon; title: string; time: string; done?: boolean; color: string }) {
  const c = done ? (colorMap[color] ?? colorMap.primary) : "bg-muted text-muted-foreground";
    
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${c}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium">{title}</span>
      </div>
      <span className="text-sm text-muted-foreground">{time}</span>
    </div>
  );
}
