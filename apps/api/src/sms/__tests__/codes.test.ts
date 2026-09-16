import { isRetryableStatus, isSettledStatus } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { describeProviderError, describeProviderStatus } from '../provider/codes.js';

describe('describeProviderError', () => {
  it('reads the recipient error as being about the recipient', () => {
    // Error 13 is the only one in the vendor's table caused by the number we
    // were handed. Everything else is our account, and blaming the customer's
    // phone for an expired API key sends support in the wrong direction.
    const described = describeProviderError(13);
    expect(described.reason).toBe('invalid-recipient');
    expect(described.retryable).toBe(false);
  });

  it('treats the daily cap as a quota that clears', () => {
    const described = describeProviderError(15);
    expect(described.reason).toBe('quota-exhausted');
    expect(described.retryable).toBe(true);
  });

  it('marks only the vendor’s own "temporarily disabled" codes as retryable', () => {
    expect(describeProviderError(4).retryable).toBe(true);
    expect(describeProviderError(5).retryable).toBe(true);

    // A bad key does not fix itself, and retrying is how an account spends its
    // credit against an error nobody is watching.
    for (const permanent of [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 14]) {
      expect(describeProviderError(permanent).retryable).toBe(false);
    }
  });

  it('falls back safely for codes the vendor documents nowhere', () => {
    // The vendor's OpenAPI document enumerates 16–20 and 100; its help page
    // describes none of them. This path is reachable today.
    for (const undocumented of [16, 17, 18, 19, 20, 100, 9_999]) {
      const described = describeProviderError(undocumented);
      expect(described.reason).toBe('provider-rejected');
      expect(described.retryable).toBe(false);
    }
  });

  it('survives a refusal that carries no code at all', () => {
    expect(describeProviderError(null).reason).toBe('provider-rejected');
    expect(describeProviderError(undefined).retryable).toBe(false);
  });
});

describe('describeProviderStatus', () => {
  it('separates a handset that was unreachable from one that never will be', () => {
    // 5 is «did not reach the handset» — switched off, no coverage. 7 is the
    // recipient blocking the line. Sending again is right for one and is a
    // regulatory complaint for the other.
    expect(describeProviderStatus(5).status).toBe('undelivered');
    expect(isRetryableStatus(describeProviderStatus(5).status)).toBe(true);

    expect(describeProviderStatus(7).status).toBe('rejected');
    expect(isRetryableStatus(describeProviderStatus(7).status)).toBe(false);
  });

  it('files every recipient-side refusal as rejected', () => {
    for (const code of [7, 11, 12, 13, 14, 15, 16]) {
      expect(describeProviderStatus(code).status).toBe('rejected');
    }
  });

  it('files our own daily cap as a failure, not as the recipient’s doing', () => {
    expect(describeProviderStatus(17).status).toBe('failed');
  });

  it('keeps an unrecognised id unsettled so polling continues', () => {
    // A message id can be unknown to the vendor for a few seconds after it is
    // issued. Settling on «status 8» would abandon a message that was sent.
    const described = describeProviderStatus(8);
    expect(described.status).toBe('unknown');
    expect(isSettledStatus(described.status)).toBe(false);
  });

  it('maps the delivered and in-flight codes', () => {
    expect(describeProviderStatus(0).status).toBe('queued');
    expect(describeProviderStatus(4).status).toBe('delivered');
    expect(isSettledStatus(describeProviderStatus(4).status)).toBe(true);

    for (const inFlight of [1, 2, 3]) {
      expect(isSettledStatus(describeProviderStatus(inFlight).status)).toBe(false);
    }
  });

  it('does not invent a status for a code it has never seen', () => {
    expect(describeProviderStatus(21).status).toBe('unknown');
    expect(describeProviderStatus(null).status).toBe('unknown');
  });
});
