import { useState } from "react";
import { HelpCircle, Mail, Phone, MessageCircle, ChevronDown, Search, BookOpen, ShieldCheck, Wallet, Briefcase, Star } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
  category: "getting-started" | "payments" | "verification" | "ratings";
}

const FAQS: FaqItem[] = [
  {
    q: "إزاي أعمل حساب جديد على سندة؟",
    a: "اضغط على \"انضم كعامل\" أو \"انضم كصاحب عمل\" من الصفحة الرئيسية، املا البيانات الأساسية (الاسم، رقم الموبايل، المدينة) وهيتم إنشاء الحساب مباشرة. بعد التسجيل هتقدر تستخدم كل المميزات الأساسية على طول.",
    category: "getting-started",
  },
  {
    q: "إزاي بنشر وظيفة جديدة كصاحب عمل؟",
    a: "سجّل دخول بحساب صاحب العمل، اضغط على \"انشر وظيفة\" في الشريط العلوي، املا التفاصيل (العنوان، الفئة، المدينة، السعر، عدد الساعات، تاريخ البدء) وانشر. بمجرد النشر، الوظيفة هتظهر للعمال في الرئيسية.",
    category: "getting-started",
  },
  {
    q: "إزاي بقدّم على وظيفة كعامل؟",
    a: "من صفحة تفاصيل الوظيفة، اضغط على زر \"تقديم على الوظيفة\"، اكتب رسالة قصيرة توضح خبرتك ومدى توافقك مع المتطلبات، وأرسل التقديم. صاحب العمل هيتلقى إشعار وهيراجع طلبك.",
    category: "getting-started",
  },
  {
    q: "إيه هو نظام الضمان (Escrow)؟",
    a: "هو نظام يحمي الطرفين: صاحب العمل بيحجز مبلغ الوظيفة في حساب ضمان لما يقبل عامل. المبلغ ما بيتحولش للعامل إلا بعد ما الوظيفة تخلص ويتسجل Check-out. لو في أي نزاع، إدارة سندة بتتدخل وتراجع البلاغ.",
    category: "payments",
  },
  {
    q: "إمتى بقدر أسحب فلوسي من المحفظة؟",
    a: "تقدر تسحب في أي وقت بشرط يكون عندك رصيد متاح. اضغط على \"المحفظة\" من القائمة، اختار \"سحب\"، حدد المبلغ، وهيتم التحويل لحسابك البنكي خلال 24-48 ساعة عمل.",
    category: "payments",
  },
  {
    q: "ليه لازم أوثّق هويتي؟",
    a: "التوثيق بيحميك وبيحمي العملاء التانيين. أصحاب العمل بيثقوا في الحسابات الموثقة أكتر، وكمان بيفتحلك وظائف أعلى أجراً. التوثيق سهل: بطاقة رقم قومي + فيش جنائي + صورة شخصية.",
    category: "verification",
  },
  {
    q: "هل الفيش الجنائي لازم يكون موجه لسندة؟",
    a: "أيوه، لازم يكون موجه لـ\"منصة سندة للخدمات\" أو \"لمن يهمه الأمر\". الفيش لازم يكون حديث (أقل من 3 شهور).",
    category: "verification",
  },
  {
    q: "إزاي بقييم عامل أو صاحب عمل؟",
    a: "بعد ما الوظيفة تخلص، هتلاقي خيار \"تقييم\" في صفحة الوظيفة. اختار من 1 لـ 5 نجوم واكتب تعليق. التقييمات بتبني سمعتك وبتساعد غيرك ياخد قراره.",
    category: "ratings",
  },
  {
    q: "إيه اللي بيحصل لو نزاع بيني وبين الطرف التاني؟",
    a: "لو في أي خلاف، تقدر تقدم بلاغ من صفحة التفاصيل أو من المحادثة. إدارة سندة بتراجع البلاغ خلال 24 ساعة، ولو ثبت حقك، بتاخد المبلغ المستحق من حساب الضمان.",
    category: "ratings",
  },
];

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "getting-started", label: "البداية" },
  { id: "payments", label: "المدفوعات" },
  { id: "verification", label: "التوثيق" },
  { id: "ratings", label: "التقييمات" },
] as const;

const CONTACT = [
  { icon: Mail, label: "hello@sanda.app", href: "mailto:hello@sanda.app" },
  { icon: Phone, label: "16700", href: "tel:16700" },
  { icon: MessageCircle, label: "دردشة مباشرة", href: "/chat" },
];

const GUIDES = [
  {
    icon: Briefcase,
    title: "دليل صاحب العمل",
    desc: "تعرّف على إزاي تنشر وظائف وتختار أفضل العمال.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "دليل العامل",
    desc: "إزاي تلاقي وظائف، تقدّم عليها، وتزيد دخلك.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Wallet,
    title: "المحفظة والضمان",
    desc: "كل اللي محتاج تعرفه عن سحب وإيداع الأموال.",
    color: "bg-success/10 text-success",
  },
  {
    icon: ShieldCheck,
    title: "الأمان والتوثيق",
    desc: "ليه التوثيق مهم وإزاي تحمي حسابك.",
    color: "bg-warning/10 text-warning",
  },
];

export default function Help() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filtered = FAQS.filter((f) => {
    const matchCat = category === "all" || f.category === category;
    const matchQ = !query || f.q.includes(query) || f.a.includes(query);
    return matchCat && matchQ;
  });

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl" dir="rtl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <HelpCircle className="h-3.5 w-3.5" /> مركز المساعدة
          </div>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-2">
            إزاي نقدر نساعدك؟
          </h1>
          <p className="text-muted-foreground">
            ابحث في الأسئلة الشائعة أو تواصل معانا في أي وقت.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن إجابة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 h-12"
          />
        </div>

        {/* Quick guides */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {GUIDES.map((g) => (
            <Card key={g.title} className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-5 text-right space-y-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${g.color}`}>
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <Button
              key={c.id}
              variant={category === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {/* FAQ list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> الأسئلة الشائعة ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                مفيش إجابات مطابقة للبحث.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((f, idx) => {
                  const isOpen = openIdx === idx;
                  return (
                    <li key={f.q}>
                      <button
                        type="button"
                        onClick={() => setOpenIdx(isOpen ? null : idx)}
                        className="w-full text-right px-6 py-4 flex items-center justify-between gap-3 hover:bg-muted/30"
                      >
                        <span className="font-semibold text-sm">{f.q}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-sm text-foreground/80 leading-relaxed">
                          {f.a}
                          <Badge variant="outline" className="me-2 mt-2 text-[10px]">
                            {CATEGORIES.find((c) => c.id === f.category)?.label}
                          </Badge>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base">محتاج مساعدة أكتر؟ تواصل معانا</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {CONTACT.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">تواصل</div>
                    <div className="font-semibold text-sm">{c.label}</div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
