import { Link } from "react-router-dom";
import { Briefcase, Mail, Phone, MapPin, Shield, Wallet, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-xl text-background mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>سندة</span>
            </Link>
            <p className="text-sm leading-relaxed text-background/60">
              منصة وظائف بارت-تايم موثوقة تربط أصحاب العمل بالعمال بنظام ضمان مالي وتقييمات حقيقية.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-background mb-4">المنصة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="hover:text-background transition-colors">تصفح الوظائف</Link></li>
              <li><Link to="/jobs/new" className="hover:text-background transition-colors">انشر وظيفة</Link></li>
              <li><Link to="/register" className="hover:text-background transition-colors">انضم كعامل</Link></li>
              <li><Link to="/register" className="hover:text-background transition-colors">انضم كصاحب عمل</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-background mb-4">المميزات</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Shield className="h-4 w-4" /> نظام ضمان مالي</li>
              <li className="flex items-center gap-2"><Wallet className="h-4 w-4" /> محفظة آمنة</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> دردشة فورية</li>
              <li className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> تسجيل حضور بـ QR</li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-background mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>القاهرة، التجمع الخامس</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>16700</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>hello@sanda.app</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-background/40">
          <p>© {new Date().getFullYear()} سندة. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link to="/help" className="hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm">مركز المساعدة</Link>
            <Link to="/about" className="hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm">من نحن</Link>
            <Link to="/terms" className="hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm">الشروط</Link>
            <Link to="/privacy" className="hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm">الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
