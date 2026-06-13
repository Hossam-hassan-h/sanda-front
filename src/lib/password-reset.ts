export const OTP_LAST_SENT_KEY = "otp_last_sent";
export const RESET_EMAIL_KEY = "password_reset_email";
export const RESET_OTP_KEY = "password_reset_otp";
export const RESET_STEP_KEY = "password_reset_step";
export const OTP_COOLDOWN_SECONDS = 60;

export const normalizeResetEmail = (email: string) => email.trim().toLowerCase();

export const getOtpCooldownRemaining = () => {
  const lastSent = Number(localStorage.getItem(OTP_LAST_SENT_KEY) || 0);
  if (!lastSent) return 0;

  const elapsedSeconds = Math.floor((Date.now() - lastSent) / 1000);
  return Math.max(0, OTP_COOLDOWN_SECONDS - elapsedSeconds);
};

export const markOtpSent = () => {
  localStorage.setItem(OTP_LAST_SENT_KEY, Date.now().toString());
};

export const setResetStep = (step: 1 | 2 | 3) => {
  localStorage.setItem(RESET_STEP_KEY, step.toString());
};

export const persistResetEmail = (email: string) => {
  localStorage.setItem(RESET_EMAIL_KEY, normalizeResetEmail(email));
};

export const persistResetOtp = (otp: string) => {
  localStorage.setItem(RESET_OTP_KEY, otp);
};

export const clearResetFlow = () => {
  localStorage.removeItem(RESET_EMAIL_KEY);
  localStorage.removeItem(RESET_OTP_KEY);
  localStorage.removeItem(RESET_STEP_KEY);
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as {
    response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
    message?: string;
  };
  const validationMessage = maybeError.response?.data?.errors?.[0]?.message;
  const responseMessage = maybeError.response?.data?.message;

  return (
    (responseMessage === "Validation Error" ? validationMessage : responseMessage) ||
    validationMessage ||
    maybeError.message ||
    fallback
  );
};
