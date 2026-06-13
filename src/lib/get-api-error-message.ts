const FALLBACK_MESSAGES: Record<number, string> = {
  400: "البيانات المدخلة غير صحيحة.",
  401: "انتهت الجلسة أو بيانات الدخول غير صحيحة.",
  403: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  404: "المورد المطلوب غير موجود.",
  409: "يوجد تعارض مع بيانات محفوظة بالفعل.",
  413: "حجم الملف أكبر من المسموح.",
  422: "يرجى مراجعة الحقول المدخلة.",
  429: "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
};

const HTML_PATTERN = /<[^>]+>/;
const INTERNAL_PATTERN =
  /mongo|mongoose|duplicate key|e11000|stack|trace|jwt|token|authorization|password/i;

const isSafeMessage = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return !!trimmed && !HTML_PATTERN.test(trimmed) && !INTERNAL_PATTERN.test(trimmed);
};

const fromValidationDetails = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const firstSafe = value.find(isSafeMessage);
    return firstSafe?.trim() ?? null;
  }

  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      if (isSafeMessage(entry)) return entry.trim();
      const nested = fromValidationDetails(entry);
      if (nested) return nested;
    }
  }

  return null;
};

export const getApiErrorMessage = (error: unknown, fallback = "حدث خطأ غير متوقع. حاول مرة أخرى."): string => {
  if (!error) return fallback;
  const maybeError = error as {
    code?: string;
    message?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
    request?: unknown;
  };

  const status = maybeError.response?.status;
  const data = maybeError.response?.data;

  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    if (isSafeMessage(body.message)) return body.message.trim();
    if (isSafeMessage(body.error)) return body.error.trim();
    const validationMessage = fromValidationDetails(body.errors ?? body.details ?? body.data);
    if (validationMessage) return validationMessage;
  }

  if (status) {
    if (status >= 500) return "الخدمة غير متاحة مؤقتا. حاول مرة أخرى لاحقا.";
    return FALLBACK_MESSAGES[status] ?? fallback;
  }

  if (maybeError.code === "ECONNABORTED") {
    return "انتهت مهلة الاتصال. حاول مرة أخرى.";
  }

  if (maybeError.request) {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.";
  }

  if (isSafeMessage(maybeError.message)) {
    return maybeError.message.trim();
  }

  return fallback;
};
