/**
 * The small amount of cryptography an account needs.
 *
 * Server-only. Nothing here may be imported from a client component: it reads
 * `SESSION_SECRET`, and a secret that reaches a bundle has already leaked.
 *
 * Three jobs, each with a different requirement:
 *
 * - **Session tokens and one-time codes are keyed, not salted.** They are
 *   looked up by their hash, so the hash has to be deterministic. A plain
 *   SHA-256 of a five-digit code is a hundred thousand entries someone with
 *   the database can precompute in a second; keyed with a secret they do not
 *   have, it is not. The short lifetime and the attempt counter do the rest.
 * - **Passwords are salted and slow.** They are chosen by people, so they are
 *   guessable, and the only defence is making each guess expensive. scrypt
 *   with a per-password salt, from the standard library.
 * - **Every comparison is constant-time.** Comparing hashes with `===` leaks
 *   how many leading bytes matched, and a token can be recovered a byte at a
 *   time from nothing but response timing.
 */
import {
  createHmac,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/**
 * `scrypt` as a promise.
 *
 * Written out rather than wrapped with `promisify`, which erases the overload
 * that takes tuning parameters — and the tuning is the entire point of using
 * scrypt over a plain digest.
 */
function derive(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/**
 * OWASP's floor for scrypt, expressed the way node's API takes it.
 *
 * `maxmem` is stated because node's default is exactly the 32 MiB these
 * parameters need, and the check is strict — left out, every hash throws.
 */
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LENGTH = 32;

export class SecretMissingError extends Error {
  override readonly name = 'SecretMissingError';
}

/**
 * The key every deterministic hash here is taken under.
 *
 * Read once, at first use rather than at import, so a module graph that merely
 * mentions this file does not fail to load.
 *
 * In development a missing secret becomes a random one, generated per process.
 * That is deliberate: a fixed development default is a real key the moment
 * somebody copies the file to a server, and a per-process one merely means
 * sessions do not survive a restart — which is true of the store anyway.
 */
let cachedKey: Buffer | undefined;

function key(): Buffer {
  if (cachedKey !== undefined) return cachedKey;

  const configured = process.env['SESSION_SECRET'];

  if (typeof configured === 'string' && configured.trim() !== '') {
    cachedKey = Buffer.from(configured, 'utf8');
    return cachedKey;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new SecretMissingError('SESSION_SECRET is required');
  }

  cachedKey = randomBytes(32);
  return cachedKey;
}

/** A 256-bit opaque token, URL-safe. What a session cookie carries. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Keyed digest, hex. Deterministic, so it can be a lookup key. */
export function keyedDigest(value: string): string {
  return createHmac('sha256', key()).update(value).digest('hex');
}

/** Compare two hex digests without leaking where they first differ. */
export function digestsMatch(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');

  // `timingSafeEqual` throws on a length mismatch, which would itself be a
  // signal. Different lengths mean different values; say so without comparing.
  if (a.length !== b.length || a.length === 0) return false;

  return timingSafeEqual(a, b);
}

/**
 * A numeric one-time code.
 *
 * `randomInt` draws from the CSPRNG with rejection sampling, so every code is
 * equally likely. `Math.random` is neither unpredictable nor uniform here, and
 * a predictable code is not a second factor.
 */
export function newNumericCode(digits: number): string {
  let code = '';
  for (let index = 0; index < digits; index += 1) code += String(randomInt(0, 10));
  return code;
}

/** Hash a password for storage. The salt travels with it. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derive(password, salt, KEY_LENGTH, SCRYPT);

  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Check a password against a stored hash.
 *
 * Returns false rather than throwing on a malformed record: a corrupt row is a
 * failed sign-in, not a stack trace on a login page.
 */
export async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelism = Number(parts[3]);
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelism)) {
    return false;
  }

  // Bounded by what this code issues. The parameters decide how much memory
  // the check allocates, so a record with a larger cost than we ever wrote is
  // a failed sign-in rather than an invitation to allocate gigabytes.
  if (cost > SCRYPT.N || blockSize > SCRYPT.r || parallelism > SCRYPT.p) return false;

  const salt = Buffer.from(parts[4] ?? '', 'base64');
  const expected = Buffer.from(parts[5] ?? '', 'base64');
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await derive(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: SCRYPT.maxmem,
  });

  return timingSafeEqual(derived, expected);
}
