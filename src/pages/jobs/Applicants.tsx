import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, MapPin, MessageCircle, Star, X } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import PaymentModal from "@/components/PaymentModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicants, useJob, useRejectApplicant } from "@/hooks/useJobs";
import { useJobAssignments } from "@/hooks/useJobAssignments";
import { useCreateConversation } from "@/hooks/useChat";
import { toast } from "@/hooks/use-toast";

export default function Applicants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: job } = useJob(id!);
  const { data: applicants, isLoading } = useApplicants(id!);
  const { data: assignments } = useJobAssignments(id!);
  const reject = useRejectApplicant();
  const createConversation = useCreateConversation();
  const [paymentFor, setPaymentFor] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const handleReject = async (appId: string) => {
    if (reject.isPending) return;
    try {
      await reject.mutateAsync(appId);
      toast({ title: "Applicant rejected" });
    } catch {
      toast({ title: "Reject failed", variant: "destructive" });
    }
  };

  const handleMessage = async (workerId: string) => {
    setMessagingId(workerId);
    try {
      const assignment = assignments?.find((item) => item.workerId === workerId);
      if (!assignment) {
        toast({ title: "Assignment not found for this worker", variant: "destructive" });
        return;
      }
      const conv = await createConversation.mutateAsync(assignment.id ?? assignment._id ?? "");
      navigate(`/chat?conversation=${conv.id ?? conv._id ?? ""}`);
    } catch {
      toast({ title: "Unable to open chat", variant: "destructive" });
    } finally {
      setMessagingId(null);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentFor(null);
    queryClient.invalidateQueries({ queryKey: ["applicants", id] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <Link to={`/jobs/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 rotate-180" />
          Back to job
        </Link>

        <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-1">
          Applicants for "{job?.title}"
        </h1>
        <p className="text-muted-foreground mb-8">
          {applicants?.length ?? 0} applicants
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : applicants && applicants.length > 0 ? (
          <div className="space-y-4">
            {applicants.map((application) => (
              <div
                key={application.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row gap-4"
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={application.worker.avatar} />
                  <AvatarFallback>{application.worker.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <Link
                        to={`/profile/${application.worker.id}`}
                        className="font-heading font-bold text-lg hover:text-primary"
                      >
                        {application.worker.name}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          {application.worker.rating?.toFixed(1) ?? "-"} ({application.worker.ratingsCount ?? 0})
                        </span>
                        {application.worker.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {application.worker.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {application.status === "accepted" && (
                      <Badge className="bg-success/10 text-success border-success/20">Accepted</Badge>
                    )}
                    {application.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                  </div>

                  {application.worker.skills && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {application.worker.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {application.message && (
                    <p className="text-foreground/80 text-sm bg-muted/50 rounded-lg p-3 mb-3">
                      {application.message}
                    </p>
                  )}

                  {application.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="accent" onClick={() => setPaymentFor(application.id)}>
                        <Check className="h-4 w-4" />
                        Accept and pay
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(application.id)} disabled={reject.isPending}>
                        {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Reject
                      </Button>
                    </div>
                  )}

                  {application.status === "accepted" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMessage(application.worker.id)}
                      disabled={messagingId === application.worker.id && createConversation.isPending}
                    >
                      {messagingId === application.worker.id && createConversation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Message
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            No applicants yet.
          </div>
        )}
      </div>

      <PaymentModal
        open={!!paymentFor}
        onOpenChange={(open) => !open && setPaymentFor(null)}
        applicationId={paymentFor}
        jobTitle={job?.title ?? ""}
        amount={job?.price ?? 0}
        onSuccess={handlePaymentSuccess}
      />
    </UserLayout>
  );
}
