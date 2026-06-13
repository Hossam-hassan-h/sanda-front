import { useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, MapPin, SlidersHorizontal, Briefcase } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import JobCard from "@/components/jobs/JobCard";
import { useJobs } from "@/hooks/useJobs";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/usePagination";
import { buildPageItems } from "@/lib/pagination";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

const cities = ["all", "القاهرة", "الجيزة", "الإسكندرية", "المنصورة"];
const categories = ["all", "ضيافة وفعاليات", "تنظيف", "صيانة وتركيبات", "مطاعم", "تسويق ميداني", "تصوير"];

const PAGE_SIZE = 6;

export default function JobsFeed() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");

  const debouncedQ = useDebounce(q, 350);
  const filters = useMemo(() => ({ q: debouncedQ || undefined, city, category }), [debouncedQ, city, category]);
  const { data: jobs, isLoading, isError } = useJobs(filters);

  const totalJobs = jobs?.length ?? 0;
  const { page, totalPages, goToPage, resetPage, pageRange } = usePagination({ totalItems: totalJobs, pageSize: PAGE_SIZE });

  // Reset to first page whenever filters change
  useEffect(() => {
    resetPage();
  }, [debouncedQ, city, category, resetPage]);

  const visibleJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.slice(pageRange.start, pageRange.end);
  }, [jobs, pageRange]);

  const pageItems = useMemo(() => buildPageItems(page, totalPages), [page, totalPages]);

  return (
    <UserLayout>
      <section className="bg-gradient-to-br from-primary to-primary-deep text-primary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mb-2">الوظائف المتاحة</h1>
          <p className="text-primary-foreground/80 mb-6">اعثر على وظيفتك المناسبة بين أكثر من 400 وظيفة بارت-تايم</p>

          <div className="bg-card text-foreground rounded-2xl p-3 md:p-4 flex flex-col md:flex-row gap-2 shadow-xl">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن وظيفة (مثل: نادل، تنظيف...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="ps-4 pe-10 border-0 focus-visible:ring-0 h-11"
              />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="md:w-48 h-11 border-0">
                <MapPin className="h-4 w-4 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c === "all" ? "كل المدن" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="md:w-56 h-11 border-0">
                <SlidersHorizontal className="h-4 w-4 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c === "all" ? "كل الفئات" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="lg" className="h-11">بحث</Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-heading font-bold text-lg">
            {isLoading ? "جاري التحميل..." : `${totalJobs} وظيفة`}
          </h2>
          {!isLoading && totalJobs > 0 && (
            <p className="text-sm text-muted-foreground">
              عرض {pageRange.start + 1}–{pageRange.end} من {totalJobs}
            </p>
          )}
        </div>

        {isError ? (
          <Alert variant="destructive" className="my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>خطأ في تحميل الوظائف</AlertTitle>
            <AlertDescription>حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : visibleJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleJobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <Briefcase className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-heading font-bold text-lg text-muted-foreground mb-2">لا توجد وظائف تطابق بحثك</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              جرّب تغيير كلمات البحث أو الفلاتر. يمكنك أيضاً تصفح جميع الفئات المتاحة.
            </p>
            <button
              onClick={() => { setQ(""); setCity("all"); setCategory("all"); }}
              className="mt-4 text-sm text-primary font-semibold hover:underline"
            >
              مسح الفلاتر
            </button>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <nav role="navigation" aria-label="ترقيم الصفحات" className="mt-10 flex justify-center">
            <ul className="flex flex-row items-center gap-1">
              <li>
                <button
                  type="button"
                  aria-label="الصفحة السابقة"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "gap-1 ps-2.5 pe-3 h-11",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <span>السابق</span>
                </button>
              </li>

              {pageItems.map((item, idx) =>
                item === "ellipsis" ? (
                  <li key={`e-${idx}`} aria-hidden="true">
                    <span className="flex h-11 w-11 items-center justify-center text-muted-foreground">…</span>
                  </li>
                ) : (
                  <li key={item}>
                    <button
                      type="button"
                      aria-label={`الصفحة ${item}`}
                      aria-current={item === page ? "page" : undefined}
                      onClick={() => goToPage(item)}
                      className={cn(
                        buttonVariants({ variant: item === page ? "outline" : "ghost", size: "icon" }),
                        "h-11 w-11",
                      )}
                    >
                      {item}
                    </button>
                  </li>
                ),
              )}

              <li>
                <button
                  type="button"
                  aria-label="الصفحة التالية"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "gap-1 pe-2.5 ps-3 h-11",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <span>التالي</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </nav>
        )}
      </section>
    </UserLayout>
  );
}
