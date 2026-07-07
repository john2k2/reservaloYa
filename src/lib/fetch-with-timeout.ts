/**
 * Returns an AbortSignal that fires after `timeoutMs`, for bounding external
 * dependency calls (payments, email, WhatsApp) that could otherwise hang
 * indefinitely instead of failing fast into the existing error handling.
 */
export function timeoutSignal(timeoutMs: number): AbortSignal | undefined {
  return typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined;
}
