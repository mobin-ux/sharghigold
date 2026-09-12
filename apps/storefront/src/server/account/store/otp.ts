import { assertAvailable } from './availability';
import type { OtpRecord } from './records';
import { tables } from './tables';

export function putChallenge(record: OtpRecord): void {
  assertAvailable();
  tables().challenges.set(record.mobile, record);
}

export function findChallenge(mobile: string): OtpRecord | undefined {
  assertAvailable();
  return tables().challenges.get(mobile);
}

export function dropChallenge(mobile: string): void {
  tables().challenges.delete(mobile);
}
