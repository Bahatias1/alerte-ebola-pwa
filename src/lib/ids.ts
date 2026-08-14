const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True only for a real UUID — never for offline placeholders like admin-uuid-offline. */
export function isAuthUserId(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function newClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUniqueViolation(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes('duplicate') || m.includes('unique') || m.includes('23505');
}
