import { Loader2 } from "lucide-react";

/**
 * Full-page loading spinner shown while lazy-loaded pages are loading.
 * Used as the Suspense fallback in App.tsx.
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
