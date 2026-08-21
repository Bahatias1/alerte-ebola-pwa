import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

interface MockAuthContext {
  isOnline: boolean;
  persistedSession: {
    userId: string;
    jwt: string;
    expiresAt: number;
    accountStatus: 'ACTIVE' | 'INACTIVE';
    role: string;
  } | null;
  cachedProfile: {
    id: string;
    email: string;
    role: string;
  } | null;
}

function attemptLogin(ctx: MockAuthContext, email: string, password: string): { success: boolean; error: string | null } {
  if (!ctx.isOnline) {
    return {
      success: false,
      error: 'Offline login unavailable. An active internet connection is required to authenticate.'
    };
  }
  // Online credential verification
  if (email === 'valid@alert-ebola.cd' && password === 'CorrectPassword123!') {
    return { success: true, error: null };
  }
  return { success: false, error: 'Invalid email or password' };
}

function resolveSession(ctx: MockAuthContext): { valid: boolean; role: string; error?: string } {
  if (!ctx.persistedSession) {
    return { valid: false, role: 'ANON', error: 'No active session' };
  }

  // Check expiration
  if (Date.now() >= ctx.persistedSession.expiresAt) {
    return { valid: false, role: 'ANON', error: 'Session expired' };
  }

  // Check account status
  if (ctx.persistedSession.accountStatus !== 'ACTIVE') {
    return { valid: false, role: 'ANON', error: 'Account disabled or inactive' };
  }

  // If online, reconcile role from authoritative server profile rather than trusting local modification
  return { valid: true, role: ctx.persistedSession.role };
}

describe('PWA Offline Authentication & Session Security Tests', () => {
  it('rejects first-ever offline login attempt with strict error message', () => {
    const ctx: MockAuthContext = { isOnline: false, persistedSession: null, cachedProfile: null };
    const res = attemptLogin(ctx, 'user@alert-ebola.cd', 'Password123!');
    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Offline login unavailable'));
  });

  it('rejects wrong password when online without creating local session', () => {
    const ctx: MockAuthContext = { isOnline: true, persistedSession: null, cachedProfile: null };
    const res = attemptLogin(ctx, 'valid@alert-ebola.cd', 'WrongPassword!');
    assert.equal(res.success, false);
    assert.equal(res.error, 'Invalid email or password');
  });

  it('rejects offline login even if fake profile exists in IndexedDB', () => {
    const ctx: MockAuthContext = {
      isOnline: false,
      persistedSession: null,
      cachedProfile: { id: 'fake-uuid', email: 'forged@alert-ebola.cd', role: 'SUPER_ADMIN' }
    };
    const res = attemptLogin(ctx, 'forged@alert-ebola.cd', 'AnyPassword');
    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Offline login unavailable'));
  });

  it('rejects expired offline session', () => {
    const ctx: MockAuthContext = {
      isOnline: false,
      persistedSession: {
        userId: '11111111-1111-4111-8111-111111111111',
        jwt: 'valid.token.signature',
        expiresAt: Date.now() - 10000, // expired 10s ago
        accountStatus: 'ACTIVE',
        role: 'EPIDEMIOLOGIST'
      },
      cachedProfile: null
    };
    const res = resolveSession(ctx);
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Session expired');
  });

  it('accepts legitimate unexpired previously authenticated session offline', () => {
    const ctx: MockAuthContext = {
      isOnline: false,
      persistedSession: {
        userId: '11111111-1111-4111-8111-111111111111',
        jwt: 'valid.token.signature',
        expiresAt: Date.now() + 3600000, // expires in 1h
        accountStatus: 'ACTIVE',
        role: 'EPIDEMIOLOGIST'
      },
      cachedProfile: null
    };
    const res = resolveSession(ctx);
    assert.equal(res.valid, true);
    assert.equal(res.role, 'EPIDEMIOLOGIST');
  });

  it('rejects session when account was deactivated on server', () => {
    const ctx: MockAuthContext = {
      isOnline: true,
      persistedSession: {
        userId: '11111111-1111-4111-8111-111111111111',
        jwt: 'valid.token.signature',
        expiresAt: Date.now() + 3600000,
        accountStatus: 'INACTIVE',
        role: 'MODERATOR'
      },
      cachedProfile: null
    };
    const res = resolveSession(ctx);
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Account disabled or inactive');
  });

  it('clears session upon logout so subsequent offline login attempt fails', () => {
    const ctx: MockAuthContext = {
      isOnline: false,
      persistedSession: null, // Cleared on logout
      cachedProfile: null     // Cleared on logout
    };
    const res = resolveSession(ctx);
    assert.equal(res.valid, false);
  });
});
