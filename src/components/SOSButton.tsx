import { memo, useState, useEffect, useRef } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SOSButtonProps {
  jobId: string;
}

export default memo(function SOSButton({ jobId }: SOSButtonProps) {
  const { user } = useAuth();
  const [isTriggered, setIsTriggered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartTrigger = () => {
    setCountdown(3);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
    toast({
      title: "تم الإلغاء",
      description: "تم إلغاء إرسال إشارة الطوارئ بنجاح.",
    });
  };

  const triggerSOS = () => {
    if (!user) return;

    // Fetch geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload = {
          workerId: user.id,
          workerName: user.name,
          jobId,
          location: user.city || "موقع العمل الحالي",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        };

        socket.emit("sos_trigger", payload);
        setIsTriggered(true);
        toast({
          title: "تم إرسال نداء الاستغاثة",
          description: "تم تعميم موقعك الجغرافي وجاري الاتصال بالدعم وصاحب العمل.",
          variant: "destructive",
        });
      },
      (error) => {
        // Fallback without coordinates
        const payload = {
          workerId: user.id,
          workerName: user.name,
          jobId,
          location: user.city || "موقع العمل الحالي",
          coordinates: null,
        };
        socket.emit("sos_trigger", payload);
        setIsTriggered(true);
        toast({
          title: "تم إرسال نداء الاستغاثة",
          description: "تم الإرسال بدون إحداثيات GPS (يرجى تفعيل خدمة الموقع).",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 border border-red-100 rounded-2xl bg-red-50/30">
      <div className="text-center">
        <h3 className="font-bold text-red-700 flex items-center gap-1.5 justify-center">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          زر الإنقاذ الطارئ (SOS)
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          اضغط فقط في حالات الطوارئ القصوى أو عند التعرض للخطر في موقع العمل.
        </p>
      </div>

      {countdown !== null ? (
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            className="h-16 w-16 rounded-full text-lg font-bold animate-ping"
            disabled
          >
            {countdown}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1">
            <X className="w-4 h-4" />
            إلغاء الاستغاثة
          </Button>
        </div>
      ) : isTriggered ? (
        <div className="text-center p-2 rounded bg-red-100 border border-red-200">
          <p className="text-sm font-semibold text-red-700 animate-pulse">
            🚨 نداء الاستغاثة نشط حالياً. الدعم في الطريق إليك.
          </p>
        </div>
      ) : (
        <Button
          onClick={handleStartTrigger}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-5 rounded-full flex items-center gap-2 shadow-lg hover:shadow-red-500/30 transition-all hover:scale-105"
        >
          <AlertTriangle className="w-5 h-5" />
          إرسال إشارة استغاثة
        </Button>
      )}
    </div>
  );
});
