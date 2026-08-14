export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type OutboxTargetTable =
  | 'mve_alert_notifications'
  | 'form_submissions'
  | 'reported_cases';

export interface FormOutboxItem {
  id: string;
  targetTable: OutboxTargetTable;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export const MAX_OUTBOX_ATTEMPTS = 8;

export function nextOutboxStatus(input: {
  current: OutboxStatus;
  ok: boolean;
  uniqueViolation: boolean;
  attempts: number;
  maxAttempts?: number;
}): OutboxStatus {
  if (input.ok || input.uniqueViolation) return 'synced';
  const max = input.maxAttempts ?? MAX_OUTBOX_ATTEMPTS;
  if (input.attempts >= max) return 'failed';
  return 'pending';
}
