import { memo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Users, Star } from "lucide-react";
import type { Job } from "@/api/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const statusLabel: Record<Job["status"], { text: string; cls: string }> = {
  open: { text: "متاحة", cls: "bg-success/10 text-success border-success/20" },
  "in-progress": { text: "قيد التنفيذ", cls: "bg-warning/10 text-warning border-warning/20" },
  completed: { text: "مكتملة", cls: "bg-muted text-muted-foreground border-border" },
  cancelled: { text: "ملغية", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default memo(function JobCard({ job }: { job: Job }) {
  const s = statusLabel[job.status];
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex flex-col h-full bg-card border border-border rounded-2xl p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <Badge variant="outline" className="text-xs font-medium">{job.category}</Badge>
        <span className={`badge-status border shrink-0 ${s.cls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {s.text}
        </span>
      </div>

      <h3 className="font-heading font-bold text-lg leading-snug text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {job.title}
      </h3>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.city}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {job.hours} ساعات</span>
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {job.applicantsCount} متقدم</span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={job.employer.avatar} alt={job.employer.name} />
            <AvatarFallback>{job.employer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-xs min-w-0">
            <div className="font-medium text-foreground truncate">{job.employer.name}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {job.employer.rating?.toFixed(1)}
            </div>
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className="font-heading font-extrabold text-xl text-primary leading-none">{job.price}</div>
          <div className="text-xs text-muted-foreground mt-0.5">جنيه</div>
        </div>
      </div>
    </Link>
  );
});
