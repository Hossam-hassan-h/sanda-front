import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Wallet, MessageCircle, QrCode, Briefcase, Search, Star, Users, TrendingUp, type LucideIcon } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-workers.jpg";

const categories = [
  "ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير", "توصيل", "دعم تقني",
];

const features = [
  { icon: ShieldCheck, title: "نظام ضمان مالي", desc: "الفلوس متجمدة (Escrow) لحد ما يكتمل الشغل، ضمان لكل الأطراف." },
  { icon: Wallet, title: "محفظة آمنة", desc: "اسحب أرباحك في أي وقت وتابع كل عملياتك المالية." },
  { icon: MessageCircle, title: "دردشة فورية", desc: "تواصل مباشر مع صاحب العمل بعد قبولك للوظيفة." },
  { icon: QrCode, title: "تسجيل بـ QR Code", desc: "Check-in و Check-out بمسح كود وقت الوصول لتأمين أجرك." },
  { icon: Star, title: "تقييمات حقيقية", desc: "ابني سمعتك من شغل حقيقي وقيّم كل من تعامل معاك." },
  { icon: Briefcase, title: "وظائف موثقة", desc: "كل صاحب عمل موثق بالهوية قبل ما ينشر وظيفة." },
];

const steps = [
  { n: 1, title: "اعمل حساب", desc: "اختر إنت عامل ولا صاحب عمل وارفع بياناتك للتوثيق." },
  { n: 2, title: "اتفق على الوظيفة", desc: "تصفح أو انشر، قدّم، اتفق على التفاصيل بالشات." },
  { n: 3, title: "نفّذ واستلم", desc: "سجّل حضورك بـ QR، خلّص الشغل، وفلوسك تنزل محفظتك." },
];

export default function Landing() {
  return (
    <UserLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-deep text-primary-foreground">
        <div className="absolute -top-32 -end-32 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -start-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
        <div className="relative container mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <ShieldCheck className="h-4 w-4" />
              منصة وظائف بضمان مالي
            </div>
            <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              لاقي شغل بارت-تايم<br />
              <span className="text-accent">بثقة وضمان كامل</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 mb-8 max-w-xl">
              سندة بتربط أصحاب الأعمال بالعمال بنظام Escrow بيحمي الطرفين. ادفع لما الشغل يكتمل، استلم لحظة ما تخلص.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" asChild>
                <Link to="/jobs">تصفح الوظائف <ArrowLeft className="h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="/register">انضم لسندة</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm">
              <Stat n="+1,200" l="مستخدم" />
              <div className="w-px h-8 bg-white/20" />
              <Stat n="+430" l="وظيفة منشورة" />
              <div className="w-px h-8 bg-white/20" />
              <Stat n="98%" l="رضا العملاء" />
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="عمال محترفون على منصة سندة"
              width={1536}
              height={1024}
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -start-6 bg-card text-foreground rounded-xl shadow-xl p-4 flex items-center gap-3 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-semibold text-sm">المبلغ مؤمَّن</div>
                <div className="text-xs text-muted-foreground">450 ج محتجزة لحين الاكتمال</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">كيف تشتغل سندة؟</h2>
            <p className="text-muted-foreground text-lg">٣ خطوات بسيطة من التسجيل لحد استلام أجرك في المحفظة.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="card-elevated text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary text-primary-foreground font-heading font-extrabold text-2xl flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">اختر مجال شغلك</h2>
            <p className="text-muted-foreground text-lg">من الضيافة للصيانة، فرص بارت-تايم في كل مجال.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {categories.map((c) => (
              <Link
                key={c}
                to="/jobs"
                className="bg-card border-2 border-border rounded-xl p-4 text-center hover:border-primary hover:bg-primary-soft transition-all font-medium"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">إيه اللي بيميّز سندة؟</h2>
            <p className="text-muted-foreground text-lg">منصة مبنية على الثقة والأمان، لكل من العامل وصاحب العمل.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-elevated">
                <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For employers */}
      <section id="employers" className="section-padding bg-foreground text-background">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm mb-6">
              <Briefcase className="h-4 w-4" /> لأصحاب الأعمال
            </div>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl mb-4">
              لاقي العامل المناسب في دقايق
            </h2>
            <p className="text-background/70 text-lg mb-8">
              انشر وظيفتك مجاناً، استقبل تقديمات من عمال موثقين بتقييماتهم، واختار الأنسب.
              الفلوس مش بتتدفع إلا بعد ما الشغل يخلص.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "نشر وظائف مجاني بالكامل",
                "عمال موثقين بالهوية الوطنية",
                "تقييمات حقيقية من شغل سابق",
                "ضمان مالي يحميك من الغش",
              ].map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <Button variant="accent" size="lg" asChild>
              <Link to="/register">سجّل كصاحب عمل</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Users} value="1,200+" label="عامل موثق" />
            <StatCard icon={Briefcase} value="430+" label="وظيفة منفّذة" />
            <StatCard icon={Star} value="4.8" label="متوسط التقييم" />
            <StatCard icon={TrendingUp} value="15 د" label="متوسط وقت اللقاء" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary-soft">
        <div className="container-narrow text-center">
          <Search className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">جاهز تبدأ؟</h2>
          <p className="text-muted-foreground text-lg mb-8">
            انضم لآلاف العمال وأصحاب الأعمال على سندة اليوم.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="accent" size="lg" asChild>
              <Link to="/register">إنشاء حساب مجاناً</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/jobs">تصفح الوظائف</Link>
            </Button>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-heading font-extrabold text-2xl">{n}</div>
      <div className="text-primary-foreground/70 text-xs">{l}</div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="bg-background/5 border border-background/10 rounded-xl p-5">
      <Icon className="h-6 w-6 text-accent mb-3" />
      <div className="font-heading font-extrabold text-2xl">{value}</div>
      <div className="text-background/60 text-sm">{label}</div>
    </div>
  );
}
