export function messageFromTauriInvoke(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    const msg = rec.message;
    if (typeof msg === "string" && msg.trim()) {
      return msg;
    }
    const err = rec.error;
    if (typeof err === "string" && err.trim()) {
      return err;
    }
  }
  return fallback;
}
