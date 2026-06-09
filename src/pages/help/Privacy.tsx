import { Lock, Eye, Database, Share2, Shield, Trash2, Mail } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dataPoints = [
  "الاسم ورقم الموبايل",
  "المدينة والموقع الجغرافي (بموافقتك)",
  "صور بطاقة الرقم القومي (مشفّرة)",
  "سجل الوظائف والمعاملات",
  "رسائل المحادثات",
  "تقييمات ومراجعات العملاء",
];

const principles = [
  {
    icon: Database,
    title: "الحد الأدنى من البيانات",
    desc: "نجمع فقط البيانات اللي بنحتاجها فعلاً لتقديم الخدمة.",
  },
  {
    icon: Lock,
    title: "تشفير end-to-end",
    desc: "كل البيانات الحساسة (المستندات، كلمات المرور، بيانات الدفع) بتتشفّر قبل التخزين.",
  },
  {
    icon: Eye,
    title: "شفافية كاملة",
    desc: "تقدر في أي وقت تطلب نسخة من بياناتك أو حذفها بشكل نهائي.",
  },
  {
    icon: Share2,
    title: "مفيش بيع للبيانات",
    desc: "ما بنبيعش بياناتك لأي طرف ثالث. بنشاركها بس مع مزودي الدفع الضروريين.",
  },
];

export default function Privacy() {
  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">
            <Shield className="h-3 w-3 me-1" /> سياسة الخصوصية
          </Badge>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-2">
            خصوصيتك أولاً
          </h1>
          <p className="text-muted-foreground">
            في سندة، بياناتك الشخصية أمانة. تعرّف على إزاي بنجمعها، نستخدمها، ونحميها.
          </p>
        </div>

        {/* Principles */}
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {principles.map((p) => (
            <Card key={p.title}>
              <CardContent className="p-5 text-right space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data we collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> البيانات اللي بنجمعها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-2">
              {dataPoints.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/40 rounded-lg p-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Your rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> حقوقك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-loose">
            <p>
              <strong>الوصول:</strong> تقدر تطلب نسخة كاملة من بياناتك في أي وقت.
            </p>
            <p>
              <strong>التصحيح:</strong> تقدر تعدّل بياناتك من صفحة الإعدادات أو تطلب مساعدة فريق الدعم.
            </p>
            <p>
              <strong>الحذف:</strong> تقدر تطلب حذف حسابك نهائياً. بنحذف كل بياناتك خلال 30 يوم عمل.
            </p>
            <p>
              <strong>إيقاف المعالجة:</strong> تقدر توقف معالجة بياناتك للتسويق مع استمرار الخدمة الأساسية.
            </p>
          </CardContent>
        </Card>

        {/* Contact DPO */}
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground space-y-2">
            <Trash2 className="h-6 w-6 text-primary mx-auto" />
            <p>
              لطلب حذف بياناتك أو الإجابة على أي سؤال، راسل مسؤول حماية البيانات:
            </p>
            <a
              href="mailto:dpo@sanda.app"
              className="inline-flex items-center gap-2 text-primary font-semibold"
            >
              <Mail className="h-4 w-4" /> dpo@sanda.app
            </a>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          آخر تحديث: 1 يونيو 2026 — الوثيقة دي بتتوافق مع قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.
        </p>
      </div>
    </UserLayout>
  );
}
