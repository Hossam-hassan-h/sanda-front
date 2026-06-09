import { Link } from "react-router-dom";
import {
  Briefcase,
  ShieldCheck,
  Wallet,
  MessageCircle,
  Star,
  Users,
  Target,
  Heart,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "الثقة أولاً",
    desc: "نظام ضمان مالي يحمي الطرفين، وتقييمات حقيقية تبني سمعة كل مستخدم.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Wallet,
    title: "محفظة آمنة",
    desc: "كل المدفوعات والسحوبات في مكان واحد، مع تحويلات سريعة ومحمية.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: MessageCircle,
    title: "تواصل مباشر",
    desc: "دردشة فورية بين أصحاب العمل والعمال للتنسيق على كل وظيفة.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Star,
    title: "تقييمات حقيقية",
    desc: "بعد كل وظيفة، الطرفين يقيّموا بعض — السكورات بتبني السمعة وبتفتح وظائف أحسن.",
    color: "bg-warning/10 text-warning",
  },
];

const STATS = [
  { value: "+10,000", label: "عامل مسجّل" },
  { value: "+1,200", label: "صاحب عمل" },
  { value: "+8,500", label: "وظيفة تم تنفيذها" },
  { value: "4.8/5", label: "متوسط التقييم" },
];

const PILLARS = [
  {
    icon: Users,
    title: "مَن نخدم",
    desc: "أي شخص بيشتغل أو بيدوّر على شغلان بارت-تايم في مصر: طلاب، خريجين جدد، أصحاب مهن حرة، وأصحاب مشاريع بيبحثوا عن مساعدات موثوقة.",
  },
  {
    icon: Target,
    title: "مهمتنا",
    desc: "نوصّل أصحاب العمل بالعمال المهرة في أقل من 24 ساعة، مع ضمان مالي يحمي حقوق الطرفين وتقييمات بتضمن الجودة.",
  },
  {
    icon: Heart,
    title: "قيمنا",
    desc: "الشفافية، العدالة، والاحترام المتبادل. بنؤمن إن الشغل المحترم يبدأ من منصة محترمة.",
  },
];

export default function About() {
  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-10 max-w-5xl" dir="rtl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Briefcase className="h-3.5 w-3.5" /> من نحن
          </div>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-3">
            بنوصّل أصحاب العمل بالعمال المهرة، بسرعة وأمان
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            سندة منصة مصرية متخصصة في الوظائف بارت-تايم. بتربط أصحاب المشاريع
            بالعمال المهرة في نفس المنطقة، وبتضمن حقوق الطرفين بنظام ضمان
            مالي وتقييمات حقيقية.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {STATS.map((s) => (
            <Card key={s.label} className="text-center">
              <CardContent className="p-5">
                <div className="font-heading font-extrabold text-2xl text-primary mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pillars */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-2xl mb-5 text-center">
            إحنا بنؤمن بـ
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <Card key={p.title} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-6 text-right space-y-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-bold text-lg">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values / Why Sanda */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-2xl mb-5 text-center">
            ليه سندة؟
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <Card key={v.title} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 text-right space-y-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.color}`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {v.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story */}
        <Card className="mb-12">
          <CardContent className="p-6 md:p-8 space-y-4 text-right">
            <h2 className="font-heading font-bold text-2xl">قصتنا</h2>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
              سندة اتأسست سنة 2024 في القاهرة بمشكلة بسيطة: كتير من أصحاب
              المشاريع بيوصلوا لعمال موثوقين بصعوبة، وكتير من العمال المهرة
              بيدوّرون على فرص شغل حقيقية من غير واسطة. قررنا نحل المشكلة
              دي بسوق إلكتروني يربط الطرفين بنظام شفاف وآمن.
            </p>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
              بدأنا بمجموعة صغيرة من الفئات — ضيافة، تنظيف، صيانة — وكبرنا
              تدريجياً بناءً على طلب المستخدمين. دلوقتي بنخدم آلاف العمال
              وأصحاب العمل في كل المحافظات.
            </p>
            <ul className="space-y-2 pt-2">
              {[
                "تسجيل حساب مجاني بدون رسوم خفية",
                "نظام ضمان يحمي الطرفين",
                "تقييمات حقيقية بعد كل وظيفة",
                "دعم فني بالعربية على مدار اليوم",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-sm md:text-base"
                >
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card>
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <h2 className="font-heading font-bold text-2xl">عندك سؤال أو اقتراح؟</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              فريقنا متاح للمساعدة، وبيحب يسمع رأيك.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <a
                href="mailto:hello@sanda.app"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">hello@sanda.app</span>
              </a>
              <a
                href="tel:16700"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold" dir="ltr">16700</span>
              </a>
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">القاهرة، التجمع الخامس</span>
              </div>
            </div>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/jobs">تصفح الوظائف</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/help">مركز المساعدة</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
