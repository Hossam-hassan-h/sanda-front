import { FileText, Scale, Wallet, ShieldCheck, AlertTriangle, Gavel } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    icon: FileText,
    title: "مقدمة",
    body: "مرحبًا بك في منصة سندة (sanda.app). باستخدامك للمنصة فإنك توافق على الشروط والأحكام التالية، والتي تحكم علاقتك بالشركة وبالطرف الآخر في كل معاملة. إذا كنت لا توافق على أي بند، يُرجى التوقف عن استخدام المنصة فورًا.",
  },
  {
    icon: Scale,
    title: "التسجيل والحساب",
    body: "يجب أن تكون قد أتممت 18 سنة لإنشاء حساب. أنت مسؤول عن دقة البيانات المُدخلة، وعن الحفاظ على سرية كلمة المرور. إدارة سندة تحتفظ بحق تعليق أو إيقاف أي حساب يثبت تقديمه لمعلومات مضللة أو ممارسات احتيالية.",
  },
  {
    icon: Wallet,
    title: "المدفوعات ونظام الضمان (Escrow)",
    body: "تعمل سندة كوسيط بين صاحب العمل والعامل. عند قبول عامل، يُحجز مبلغ الوظيفة في حساب ضمان ولا يُحوَّل للعامل إلا بعد إتمام العمل وتسجيل Check-out. يتحمل الطرف المُقصِّر رسوم الإلغاء وفقاً للجدول أدناه.",
  },
  {
    icon: ShieldCheck,
    title: "التوثيق والأهلية",
    body: "بعض الوظائف (خاصة عالية القيمة) تتطلب حساباً موثقاً (ID + فيش جنائي). التوثيق إلزامي للعاملين الراغبين في استلام مبالغ أكبر من 1000 جنيه إجمالاً، ولأصحاب العمل الراغبين في نشر أكثر من 5 وظائف شهرياً.",
  },
  {
    icon: AlertTriangle,
    title: "البلاغات والنزاعات",
    body: "أي طرف يحق له تقديم بلاغ خلال 7 أيام من انتهاء الوظيفة. إدارة سندة تلتزم بمراجعة البلاغات خلال 24-48 ساعة عمل. في حال ثبوت التلاعب، يحق للإدارة تجميد المبالغ حتى الانتهاء من التحقيق.",
  },
  {
    icon: Gavel,
    title: "القانون المعمول به",
    body: "تخضع هذه الشروط للقانون المصري. أي نزاع غير قابل للحل ودياً يُحال إلى محاكم القاهرة الاقتصادية. آخر تحديث: يونيو 2026.",
  },
];

export default function Terms() {
  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">
            <FileText className="h-3 w-3 me-1" /> وثيقة قانونية
          </Badge>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-2">
            الشروط والأحكام
          </h1>
          <p className="text-muted-foreground">
            آخر تحديث: 1 يونيو 2026 — يُرجى قراءة الشروط بعناية قبل استخدام المنصة.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((s, i) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </span>
                  <s.icon className="h-4 w-4 text-primary" />
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-loose">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            لأي استفسار عن الشروط، راسلنا على{" "}
            <a href="mailto:legal@sanda.app" className="text-primary font-semibold">
              legal@sanda.app
            </a>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
