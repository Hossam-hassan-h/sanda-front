import { ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Flag, Briefcase, Wallet, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import AdminHeader from "@/components/admin/AdminHeader";

const adminLinks = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "المستخدمين", icon: Users },
  { to: "/admin/reports", label: "البلاغات", icon: Flag },
  { to: "/admin/jobs", label: "الوظائف", icon: Briefcase },
  { to: "/admin/wallet", label: "المحفظة", icon: Wallet },
  { to: "/admin/chat-monitor", label: "مراقبة الدردشة", icon: MessageCircle },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex-1 container mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <nav className="bg-card border border-border rounded-xl p-2 space-y-1">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
                  }`
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>القائمة</SheetTitle>
            </SheetHeader>
            <nav className="p-2 space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div>{children}</div>
      </div>
    </div>
  );
}
