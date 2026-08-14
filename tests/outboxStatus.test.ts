import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextOutboxStatus } from '../src/services/outboxTypes.ts';

describe('outbox status machine', () => {
  it('marks synced on success', () => {
    assert.equal(nextOutboxStatus({ current: 'syncing', ok: true, uniqueViolation: false, attempts: 1 }), 'synced');
  });

  it('marks synced on unique violation (idempotent retry)', () => {
    assert.equal(nextOutboxStatus({ current: 'syncing', ok: false, uniqueViolation: true, attempts: 2 }), 'synced');
  });

  it('retries as pending until max attempts', () => {
    assert.equal(nextOutboxStatus({ current: 'syncing', ok: false, uniqueViolation: false, attempts: 3 }), 'pending');
    assert.equal(nextOutboxStatus({ current: 'syncing', ok: false, uniqueViolation: false, attempts: 8 }), 'failed');
  });
});
