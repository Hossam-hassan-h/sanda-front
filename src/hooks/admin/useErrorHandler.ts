import { useState, useCallback } from "react";

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleApiError: (err: unknown) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleApiError = useCallback((err: unknown) => {
    if (err && typeof err === "object" && "response" in err) {
      const apiErr = err as { response?: { status: number; data?: { message?: string } } };
      if (apiErr.response?.status === 401) {
        setError("غير مخول. يرجى تسجيل الدخول مرة أخرى.");
      } else if (apiErr.response?.status === 403) {
        setError("ليس لديك صلاحية للقيام بهذا الإجراء.");
      } else if (apiErr.response?.status === 404) {
        setError("البيانات غير موجودة.");
      } else if (apiErr.response?.status === 500) {
        setError("خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.");
      } else {
        setError(apiErr.response?.data?.message || "حدث خطأ غير متوقع.");
      }
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("حدث خطأ غير متوقع.");
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleApiError,
  };
}