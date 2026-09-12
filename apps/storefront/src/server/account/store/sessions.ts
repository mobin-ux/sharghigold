import { randomUUID } from 'node:crypto';

import { assertAvailable } from './availability';
import type { SessionRecord } from './records';
import { tables } from './tables';

export function insertSession(record: SessionRecord): SessionRecord {
  assertAvailable();
  tables().sessions.set(record.tokenHash, record);
  return record;
}

export function findSessionByTokenHash(tokenHash: string): SessionRecord | undefined {
  assertAvailable();
  return tables().sessions.get(tokenHash);
}

export function listSessions(customerId: string): readonly SessionRecord[] {
  assertAvailable();
  const now = Date.now();
  return [...tables().sessions.values()]
    .filter(
      (session) =>
        session.customerId === customerId &&
        session.revokedAt === null &&
        Date.parse(session.expiresAt) > now,
    )
    .toSorted((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));
}

export function findSession(customerId: string, id: string): SessionRecord | undefined {
  assertAvailable();
  return listSessions(customerId).find((session) => session.id === id);
}

export function revokeSession(session: SessionRecord, now: Date): void {
  session.revokedAt = now.toISOString();
}

/** Sign out every session except one. The one kept is the caller's own. */
export function revokeOtherSessions(customerId: string, keepTokenHash: string, now: Date): number {
  assertAvailable();
  let revoked = 0;
  for (const session of tables().sessions.values()) {
    if (session.customerId !== customerId) continue;
    if (session.tokenHash === keepTokenHash || session.revokedAt !== null) continue;
    session.revokedAt = now.toISOString();
    revoked += 1;
  }
  return revoked;
}

export function newSessionId(): string {
  return randomUUID();
}
