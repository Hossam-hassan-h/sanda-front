import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ShieldCheck, Wallet, Star, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user } = useAuth();
  const logoHref = user ? "/jobs" : "/";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-10 lg:px-16">
        <Link to={logoHref} className="flex items-center gap-2 font-heading font-extrabold text-xl text-foreground mb-12">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>سندة</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-heading font-extrabold text-3xl text-foreground mb-2">{title}</h1>
            {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>

      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-primary to-primary-deep text-primary-foreground px-16 py-12 relative overflow-hidden">
        <div className="absolute -top-20 -end-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 -start-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-md">
          <h2 className="font-heading font-extrabold text-4xl leading-tight mb-4">
            وظائف بارت-تايم<br />بضمان كامل وثقة حقيقية
          </h2>
          <p className="text-primary-foreground/80 mb-12 text-lg">
            انضم لآلاف العمال وأصحاب الأعمال على سندة. ادفع بأمان، اشتغل بثقة، واستلم فلوسك فوراً.
          </p>
          <div className="space-y-4">
            <Feature icon={ShieldCheck} title="نظام ضمان مالي (Escrow)" desc="الفلوس متجمدة حتى يكتمل العمل" />
            <Feature icon={Wallet} title="محفظة آمنة" desc="اسحب أرباحك في أي وقت" />
            <Feature icon={Star} title="تقييمات حقيقية" desc="ابني سمعتك مع كل عمل" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-primary-foreground/70">{desc}</div>
      </div>
    </div>
  );
}
