import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Settings as SettingsIcon,
  HelpCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoHref = user ? "/jobs" : "/";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { label: "الوظائف", href: "/jobs", icon: <Briefcase className="w-4 h-4" /> },
    ...(user?.role === "employer"
      ? [{ label: "وظائفي", href: "/my-jobs", icon: <Briefcase className="w-4 h-4" /> }]
      : []),
    ...(user?.role === "worker"
      ? [{ label: "المحفظة", href: "/wallet", icon: <Wallet className="w-4 h-4" /> }]
      : []),
    { label: "المحادثات", href: "/chat", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={logoHref} className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">سندة</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications — NEW */}
          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.phone}</p>
                  <p className="text-xs text-primary mt-1 capitalize">{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${user.id}`} className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    الملف الشخصي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallet" className="flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    المحفظة
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    الإعدادات
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/help" className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    مركز المساعدة
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    من نحن
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      لوحة الإدارة
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                تسجيل الدخول
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                إنشاء حساب
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-muted/50 hover:text-foreground shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(!mobileOpen);
            }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container py-4">
            {user ? (
              <>
                {/* Account Section */}
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  الحساب
                </div>
                <div className="space-y-1">
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    الملف الشخصي
                  </Link>
                  <Link
                    to="/wallet"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                    المحفظة
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    الإعدادات
                  </Link>
                </div>

                <div className="my-3 border-t" />

                {/* Navigation Section */}
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  التصفح
                </div>
                <div className="space-y-1">
                  <Link
                    to="/jobs"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    الوظائف
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    المحادثات
                  </Link>
                </div>

                <div className="my-3 border-t" />

                {/* Information Section */}
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  معلومات
                </div>
                <div className="space-y-1">
                  <Link
                    to="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    مركز المساعدة
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                    من نحن
                  </Link>
                </div>

                <div className="my-3 border-t" />

                {/* Logout */}
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive rounded-md hover:bg-accent transition-colors w-full text-start"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="px-3 mb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  معلومات
                </div>
                <Link
                  to="/help"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                  مركز المساعدة
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                  من نحن
                </Link>
                <div className="my-3 border-t" />
                <div className="flex gap-2 px-3">
                  <Button variant="outline" className="flex-1" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                    تسجيل الدخول
                  </Button>
                  <Button className="flex-1" onClick={() => { navigate("/register"); setMobileOpen(false); }}>
                    إنشاء حساب
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
