## نظرة عامة

تحويل المشروع الحالي (Lingua Bridge) إلى منصة **سندة** — منصة وظائف بارت-تايم مع نظام Escrow و Chat فوري و QR Check-in. كل الواجهات RTL بالعربي، نفس design tokens الموجودة (Indigo primary + Amber accent) مع استبدال الخط بـ **Cairo**. كل الصفحات تستخدم mock data منظمة في `src/api/` بحيث يسهل استبدالها بـ axios calls للـ Node backend بتاعك بدون لمس الـ UI.

## التغييرات على الـ Design System

- `index.html`: `lang="ar" dir="rtl"`، تحديث الـ title/meta لسندة، تحميل خط Cairo من Google Fonts
- `tailwind.config.ts`: تغيير `fontFamily.heading` و `fontFamily.body` لـ Cairo
- `index.css`: نفس HSL tokens (Indigo + Amber) — إضافة tweaks بسيطة للـ RTL (spacing, icons mirror)
- إضافة `tailwindcss-rtl` معالجة عبر `start/end` classes الموجودة في Tailwind v3
- شعار جديد: أيقونة `Briefcase` مع نص "سندة"

## بنية الملفات الجديدة

```text
src/
├── api/                    ← طبقة axios جاهزة للربط بـ Node backend
│   ├── client.ts           ← axios instance + interceptor للـ JWT
│   ├── auth.ts             ← register, login, me
│   ├── jobs.ts             ← list, get, create, apply
│   ├── applications.ts
│   ├── wallet.ts
│   ├── chat.ts
│   └── admin.ts
├── hooks/                  ← React Query hooks
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useWallet.ts
│   └── ...
├── context/
│   └── AuthContext.tsx     ← user + token state
├── layouts/
│   ├── MainLayout.tsx      ← Header/Footer لكل صفحات الموقع
│   ├── AuthLayout.tsx      ← split-screen تسجيل/دخول
│   ├── DashboardLayout.tsx ← sidebar للوحات التحكم
│   └── AdminLayout.tsx
├── components/
│   ├── jobs/JobCard.tsx, JobFilters.tsx, JobPostForm.tsx
│   ├── wallet/TransactionRow.tsx, BalanceCard.tsx
│   ├── chat/ChatBox.tsx, MessageBubble.tsx
│   ├── qr/QRGenerator.tsx, QRScanner.tsx (placeholder)
│   ├── ratings/StarRating.tsx, ReviewCard.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleBadge.tsx
├── pages/
│   ├── Landing.tsx              ← الصفحة الرئيسية التعريفية
│   ├── auth/Login.tsx, Register.tsx (مع toggle عامل/صاحب عمل)
│   ├── jobs/JobsFeed.tsx        ← قائمة الوظائف + فلترة
│   ├── jobs/JobDetails.tsx      ← تفاصيل + زر تقديم
│   ├── jobs/PostJob.tsx         ← لصاحب العمل
│   ├── jobs/MyJobs.tsx          ← وظائفي
│   ├── applications/Applicants.tsx  ← المتقدمين لوظيفة
│   ├── wallet/Wallet.tsx
│   ├── chat/Chat.tsx
│   ├── profile/Profile.tsx      ← + Mini portfolio للعامل
│   ├── profile/EditProfile.tsx
│   ├── admin/AdminDashboard.tsx ← stats + charts (recharts)
│   ├── admin/AdminUsers.tsx
│   ├── admin/AdminReports.tsx
│   └── NotFound.tsx
└── lib/mock/                ← بيانات وهمية للعرض قبل ربط الـ backend
```

## الصفحات بالتفصيل

| الصفحة | الوصف | المكونات الأساسية |
|---|---|---|
| Landing `/` | hero عربي، كيف تعمل سندة (3 خطوات)، الخدمات، الأرقام، CTAs | Hero, FeatureGrid, StepsSection, CTA |
| Login `/login` | toggle (عامل / صاحب عمل) + هاتف + باسورد | AuthLayout, RoleToggle |
| Register `/register` | نموذج كامل + رفع صورة الهوية | AuthLayout, FileUpload |
| Jobs Feed `/jobs` | كروت وظائف + فلترة (المدينة/السعر/الفئة) | JobCard, JobFilters, SearchBar |
| Job Details `/jobs/:id` | تفاصيل، خريطة placeholder، تقييم صاحب العمل، زر "تقديم" | JobDetails, ApplyButton |
| Post Job `/jobs/new` | نموذج نشر وظيفة (react-hook-form + zod) | JobPostForm |
| My Jobs `/my-jobs` | tabs: open / in-progress / completed | JobsTable, StatusBadge |
| Applicants `/jobs/:id/applicants` | جدول المتقدمين + تقييماتهم + قبول/رفض → checkout placeholder | ApplicantCard, PaymentModal |
| Wallet `/wallet` | رصيد + جدول WalletTransactions (held / available / withdrawn) | BalanceCard, TransactionRow |
| Chat `/chat` | قائمة محادثات + ChatBox (UI فقط، جاهز لربط socket.io) | ConversationList, ChatBox |
| Profile `/profile/:id` | معلومات + مهارات + معرض أعمال + تقييمات | ProfileHeader, SkillsList, RatingsList |
| Active Job `/jobs/:id/active` | QR Generator (صاحب العمل) / QR Scanner placeholder (عامل) | QRGenerator, CheckInStatus |
| Admin Dashboard `/admin` | كروت إحصائيات + 2 charts (Bar/Line) | StatsCard, ChartCard |
| Admin Users `/admin/users` | جدول كل المستخدمين + ban/unban | UsersTable |
| Admin Reports `/admin/reports` | الشكاوى/النزاعات | ReportsTable |

## طبقة الربط بالـ Backend

`src/api/client.ts`:
```ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("sanda_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
```

كل صفحة تستخدم React Query hook ثابت:
```ts
const { data: jobs, isLoading } = useJobs(filters);
```

داخل الـ hook الـ mock data تتبدّل بسطر واحد لما الـ backend يبقى جاهز.

## التبعيات الجديدة

- `axios` (للربط)
- `react-hook-form` + `@hookform/resolvers` + `zod` (موجود في shadcn)
- `recharts` (للـ admin charts — موجود)
- خط Cairo من Google Fonts (CSS import فقط، بدون package)

## RTL handling

- `<html dir="rtl" lang="ar">`
- استخدام Tailwind logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*` بدل `ml/mr/pl/pr/left/right`
- مراجعة أيقونات الـ Header (Menu, Chevron) للسلوك السليم في RTL
- Form labels و input alignment يعتمدوا على RTL تلقائياً

## ما يتم حذفه/استبداله

- كل صفحات Lingua Bridge القديمة (`Programs`, `Instructors`, `Schedule`, `Stories`, `Contact`, `PlacementTest`, `Enroll`)
- Header/Footer يتم إعادة كتابتهم لسندة بالعربي
- `Index.tsx` → `Landing.tsx`

## ما هو خارج النطاق (مرحلة لاحقة)

- ربط Socket.io فعلي (UI فقط دلوقتي)
- ربط Stripe/Paymob فعلي (Checkout modal placeholder)
- منطق QR scanner كاميرا حقيقي (نعمل placeholder بـ html5-qrcode لاحقاً)
- توثيق JWT حقيقي (نستخدم mock token في localStorage)

## المخرجات

موقع كامل لـ سندة RTL بالعربي، كل الصفحات تنفع تتنقل بينها، نفس الـ design system، وكل ما يخص الـ data منظم في طبقة `api/` + `hooks/` جاهزة لتبديل الـ mock بـ axios calls لباك إندك بدون لمس أي صفحة.
