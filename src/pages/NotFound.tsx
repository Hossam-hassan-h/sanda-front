import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center">
        <div className="font-heading font-extrabold text-8xl md:text-9xl text-primary mb-4">404</div>
        <h1 className="font-heading font-bold text-2xl mb-2">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground mb-6">يبدو أن الصفحة التي تبحث عنها لم تعد متاحة.</p>
        <Button asChild>
          <Link to="/"><Home className="h-4 w-4" /> العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
