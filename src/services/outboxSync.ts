import { supabase } from '../supabaseClient';
import { db } from '../db';
import { isUniqueViolation } from '../lib/ids';
import {
  MAX_OUTBOX_ATTEMPTS,
  nextOutboxStatus,
  type FormOutboxItem,
  type OutboxTargetTable,
} from './outboxTypes';

export type EnqueueResult = {
  id: string;
  synced: boolean;
  offline: boolean;
  error?: string;
};

let syncInFlight: Promise<void> | null = null;

async function putItem(item: FormOutboxItem): Promise<void> {
  await db.formOutbox.put(item);
}

export async function enqueueSubmission(
  targetTable: OutboxTargetTable,
  payload: Record<string, unknown>,
  id: string
): Promise<FormOutboxItem> {
  const now = new Date().toISOString();
  const item: FormOutboxItem = {
    id,
    targetTable,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await putItem(item);
  return item;
}

async function syncOne(item: FormOutboxItem): Promise<FormOutboxItem> {
  const now = new Date().toISOString();
  const syncing: FormOutboxItem = {
    ...item,
    status: 'syncing',
    attempts: item.attempts + 1,
    updatedAt: now,
  };
  await putItem(syncing);

  const { error } = await supabase.from(item.targetTable).insert(item.payload);
  const unique = isUniqueViolation(error?.message || error?.code);
  const next = nextOutboxStatus({
    current: 'syncing',
    ok: !error,
    uniqueViolation: unique,
    attempts: syncing.attempts,
  });

  const updated: FormOutboxItem = {
    ...syncing,
    status: next,
    lastError: error && !unique ? error.message : undefined,
    updatedAt: new Date().toISOString(),
  };
  await putItem(updated);
  return updated;
}

export async function syncPendingOutbox(): Promise<void> {
  if (!navigator.onLine) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const pending = await db.formOutbox
        .where('status')
        .anyOf(['pending', 'failed'])
        .toArray();

      const retryable = pending.filter((item) => {
        if (item.status === 'pending') return true;
        return item.attempts < MAX_OUTBOX_ATTEMPTS;
      });

      for (const item of retryable) {
        try {
          await syncOne(item);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Erreur de synchronisation';
          await putItem({
            ...item,
            status: item.attempts + 1 >= MAX_OUTBOX_ATTEMPTS ? 'failed' : 'pending',
            attempts: item.attempts + 1,
            lastError: message,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export async function enqueueAndSync(
  targetTable: OutboxTargetTable,
  payload: Record<string, unknown>,
  id: string
): Promise<EnqueueResult> {
  await enqueueSubmission(targetTable, payload, id);

  if (!navigator.onLine) {
    return { id, synced: false, offline: true };
  }

  const current = await db.formOutbox.get(id);
  if (!current) return { id, synced: false, offline: false, error: 'Outbox introuvable' };

  try {
    const result = await syncOne(current);
    if (result.status === 'synced') {
      return { id, synced: true, offline: false };
    }
    if (!navigator.onLine) {
      return { id, synced: false, offline: true, error: result.lastError };
    }
    return { id, synced: false, offline: false, error: result.lastError || 'Échec de la synchronisation' };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur réseau';
    const offline = !navigator.onLine || /fetch|network|failed to fetch/i.test(message);
    return { id, synced: false, offline, error: message };
  }
}
