import { Briefcase, Play, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/api/types";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig = {
  open: {
    label: "مفتوحة للتقديم",
    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50/80",
    icon: <Briefcase className="w-3.5 h-3.5 mr-1" />,
  },
  "in-progress": {
    label: "قيد التنفيذ",
    color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50/80",
    icon: <Play className="w-3.5 h-3.5 mr-1 animate-pulse" />,
  },
  completed: {
    label: "مكتملة",
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50/80",
    icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
  },
  cancelled: {
    label: "ملغاة",
    color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50/80",
    icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
  },
};

export default function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open;

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
