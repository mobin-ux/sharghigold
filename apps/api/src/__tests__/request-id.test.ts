import { describe, expect, it } from 'vitest';

import { readRequestId } from '../common/request-id.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Built from codepoints so no control byte appears literally in this file. */
const ESC = String.fromCharCode(0x1b);
const NUL = String.fromCharCode(0x00);

describe('readRequestId', () => {
  it('trusts a well-formed correlation id from an upstream proxy', () => {
    expect(readRequestId('0195f0c2-6d1a-7b3e-9f21-4c8ab0d5e6f7')).toBe(
      '0195f0c2-6d1a-7b3e-9f21-4c8ab0d5e6f7',
    );
    expect(readRequestId('01JAV3K9QW2ZP7')).toBe('01JAV3K9QW2ZP7');
    // W3C trace-context style ids use dots and colons.
    expect(readRequestId('trace:4bf92f-01.7')).toBe('trace:4bf92f-01.7');
  });

  it('mints one when the header is absent or not a single value', () => {
    expect(readRequestId(undefined)).toMatch(UUID);
    expect(readRequestId(['a', 'b'])).toMatch(UUID);
    expect(readRequestId('')).toMatch(UUID);
  });

  it('replaces an id carrying characters a log line would misread', () => {
    // These reach the log aggregator, which is not a JSON parser: a newline in
    // a correlation id is how a forged log entry gets written.
    const forgedIds = [
      'abc\nWARN user=admin action=login_succeeded',
      'abc\r\nfake',
      `abc${ESC}[31mred`,
      `abc${NUL}null`,
      '<script>alert(1)</script>',
      'id with spaces',
      'a'.repeat(129),
    ];

    for (const forged of forgedIds) {
      expect(readRequestId(forged)).toMatch(UUID);
    }
  });
});
