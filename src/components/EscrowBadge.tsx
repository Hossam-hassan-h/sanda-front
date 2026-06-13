import { Lock, Unlock, RefreshCcw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EscrowStatus = "hold" | "released" | "refunded" | "none";

interface EscrowBadgeProps {
  status: EscrowStatus;
  className?: string;
}

const statusConfig = {
  hold: {
    label: "المبلغ في الضمان (مُحجتجز)",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50/80",
    icon: <Lock className="w-3.5 h-3.5 mr-1" />,
  },
  released: {
    label: "تم تحرير المبلغ للعامل",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50/80",
    icon: <Unlock className="w-3.5 h-3.5 mr-1" />,
  },
  refunded: {
    label: "تم استرداد المبلغ لصاحب العمل",
    color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50/80",
    icon: <RefreshCcw className="w-3.5 h-3.5 mr-1" />,
  },
  none: {
    label: "المبلغ غير مؤمن بعد",
    color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50/80",
    icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" />,
  },
};

export default function EscrowBadge({ status, className }: EscrowBadgeProps) {
  const config = statusConfig[status] || statusConfig.none;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-1 text-xs font-semibold flex items-center w-fit gap-1",
        config.color,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
