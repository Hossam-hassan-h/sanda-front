import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { AlertOctagon, X, Phone, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SOSAlertData {
  id: string;
  workerId: string;
  workerName: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  jobId: string;
  createdAt: string;
}

export default function SOSNotification() {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<SOSAlertData | null>(null);

  // Subscribe to 'sos_alert' socket events
  useSocket("sos_alert", (data: SOSAlertData) => {
    // Show alert to admins or employers
    if (user && (user.role === "admin" || user.role === "employer")) {
      setActiveAlert(data);
      // Play a warning sound in modern browsers (optional)
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
        audio.volume = 0.5;
        audio.play();
      } catch (e) {
        console.warn("Could not play audio alarm:", e);
      }
    }
  });

  if (!activeAlert) return null;

  const handleDismiss = () => {
    setActiveAlert(null);
  };

  const mapUrl = activeAlert.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${activeAlert.coordinates.latitude},${activeAlert.coordinates.longitude}`
    : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short" dir="rtl">
      <Card className="border-2 border-red-600 bg-red-50/95 shadow-2xl text-foreground backdrop-blur-md">
        <CardContent className="p-5 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-red-800 text-base flex items-center gap-1.5">
                حالة طوارئ نشطة (SOS)
              </h4>
              <p className="text-sm font-semibold text-red-900 mt-1">
                العامل: {activeAlert.workerName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                تاريخ الاستغاثة: {new Date(activeAlert.createdAt).toLocaleTimeString("ar-EG")}
              </p>

              <div className="mt-3 space-y-2 bg-white/70 p-3 rounded-lg border border-red-200 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>الموقع: {activeAlert.location}</span>
                </div>
                {activeAlert.coordinates && (
                  <p className="text-[10px] text-muted-foreground">
                    إحداثيات: {activeAlert.coordinates.latitude.toFixed(5)}, {activeAlert.coordinates.longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {mapUrl && (
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white gap-1 flex-1 text-xs"
                    onClick={() => window.open(mapUrl, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    عرض على الخريطة
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-100 gap-1 flex-1 text-xs"
                  onClick={() => window.open("tel:122")}
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصال بالطوارئ
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
