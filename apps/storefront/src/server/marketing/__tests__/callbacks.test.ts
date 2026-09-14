import { beforeEach, describe, expect, it } from 'vitest';

import { pendingCallbacks, requestCallback, resetCallbacks } from '@/server/marketing/callbacks';

describe('callback requests', () => {
  beforeEach(() => resetCallbacks());

  it('records a valid mobile once, however it was written', () => {
    expect(requestCallback('09121234567', 'installment').status).toBe('requested');
    expect(requestCallback('+989121234567', 'installment').status).toBe('requested');

    expect(pendingCallbacks()).toHaveLength(1);
    expect(pendingCallbacks()[0]?.topic).toBe('installment');
  });

  it('answers a repeat exactly as a first request and moves it to the back', () => {
    requestCallback('09121234567', 'installment', new Date('2026-09-01T08:00:00Z'));
    requestCallback('09351234567', 'installment', new Date('2026-09-01T09:00:00Z'));
    const again = requestCallback('09121234567', 'installment', new Date('2026-09-01T10:00:00Z'));

    expect(again).toEqual({ status: 'requested' });
    expect(pendingCallbacks().map((entry) => entry.mobile)).toEqual(['09351234567', '09121234567']);
  });

  it('refuses what is not an Iranian mobile', () => {
    expect(requestCallback('12345', 'installment').status).toBe('invalid');
    expect(requestCallback('<script>', 'installment').status).toBe('invalid');
    expect(pendingCallbacks()).toHaveLength(0);
  });
});
