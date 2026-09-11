/**
 * A customer's own account: the profile, the wallet, identity verification,
 * delivery addresses, order history and the devices holding a session.
 *
 * Everything here is *someone's*. That is the property the whole file is built
 * around, and it shapes three rules.
 *
 * **Nothing carries an owner.** No `customerId` appears in any request body,
 * because the owner is the session, and a body that names one is a request to
 * act on someone else's data (rule 8). The server reads identity from the
 * cookie and scopes every query by it; an address id in a URL is checked
 * against that, never trusted because it parsed.
 *
 * **Identity documents are not echoed back.** A national ID that has been
 * verified comes back masked and is refused for editing — it is the key to a
 * credit profile, and it stops being the customer's to change the moment a
 * bank has matched it.
 *
 * **The challenge is the server's to choose.** The code a customer writes on
 * paper for the selfie step is issued per attempt by the server. A client that
 * picks it has turned a liveness check into a formality.
 */
import { z } from 'zod';

import {
  iranianIbanSchema,
  iranianMobileSchema,
  iranianNationalIdSchema,
  jalaliDateSchema,
  positiveRialsStringSchema,
  userTextSchema,
  uuidSchema,
} from './primitives.js';

/* -------------------------------------------------------------------------- */
/* The wallet                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The wallet balance, in whole rials as a string.
 *
 * A balance is money, so it never crosses the wire as a JSON number, and it is
 * never computed anywhere but the ledger it sums (rules 5 and 15). The page
 * displays it and offers a top-up link; it does not do arithmetic on it.
 */
export const walletSummarySchema = z.object({
  balanceRials: positiveRialsStringSchema,
  updatedAt: z.iso.datetime(),
});

export type WalletSummary = z.output<typeof walletSummarySchema>;

/* -------------------------------------------------------------------------- */
/* Identity verification                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Where a customer stands with identity verification.
 *
 * `rejected` is a state of its own rather than a return to `none`, because the
 * page has to say what went wrong and «start again» is not the same message as
 * «start».
 */
export const kycStatusSchema = z.enum(['none', 'pending', 'verified', 'rejected']);

export type KycStatus = z.output<typeof kycStatusSchema>;

/** The three things verification needs, in the order it needs them. */
export const kycStepKeySchema = z.enum(['identity', 'bank', 'selfie']);

export type KycStepKey = z.output<typeof kycStepKeySchema>;

export const kycStepStateSchema = z.object({
  key: kycStepKeySchema,
  done: z.boolean(),
});

export type KycStepState = z.output<typeof kycStepStateSchema>;

export const kycProgressSchema = z.object({
  status: kycStatusSchema,
  steps: z.array(kycStepStateSchema).length(3),
  /**
   * Why the last submission was refused, in the reviewer's words. Null unless
   * the status is `rejected`.
   */
  rejectionReason: userTextSchema(200).nullable(),
  /**
   * The digits the customer writes on paper and holds in the photograph.
   *
   * Server-issued and single-use. Present only while the selfie step is the
   * one being worked on.
   */
  selfieChallenge: z
    .string()
    .regex(/^\d{5}$/, { message: 'کد تصویر معتبر نیست' })
    .nullable(),
});

export type KycProgress = z.output<typeof kycProgressSchema>;

/** Step one: who you are, checked against the civil registry. */
export const kycIdentitySchema = z.strictObject({
  nationalId: iranianNationalIdSchema,
  birthDate: jalaliDateSchema,
});

export type KycIdentityInput = z.output<typeof kycIdentitySchema>;

/** Step two: where money is returned to. */
export const kycBankSchema = z.strictObject({
  iban: iranianIbanSchema,
});

export type KycBankInput = z.output<typeof kycBankSchema>;

/**
 * Step three: the photograph.
 *
 * The image itself is not in this schema, and deliberately: it needs object
 * storage, a size and type check and a virus scan before a byte of it is
 * accepted. What is here is the acknowledgement and the challenge the customer
 * was shown, which the server compares against the one it issued.
 */
export const kycSelfieSchema = z.strictObject({
  challenge: z.string().regex(/^\d{5}$/, { message: 'کد تصویر معتبر نیست' }),
  acknowledged: z.literal(true, { message: 'قواعد ارسال تصویر را بپذیرید' }),
});

export type KycSelfieInput = z.output<typeof kycSelfieSchema>;

/* -------------------------------------------------------------------------- */
/* The profile                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The account as its owner sees it.
 *
 * `nationalId` holds the value only while it is still editable. Once identity
 * has been verified it is null and `nationalIdMasked` carries the last four
 * digits, because a verified national ID is bound to a credit profile and
 * cannot be changed from a form.
 */
export const accountProfileSchema = z
  .object({
    id: uuidSchema,
    mobile: iranianMobileSchema,
    displayName: userTextSchema(80).nullable(),
    nationalId: iranianNationalIdSchema.nullable(),
    nationalIdMasked: z.string().max(20).nullable(),
    /** True when a password has been set, so sign-in can skip the code. */
    hasPassword: z.boolean(),
    kyc: kycProgressSchema,
    joinedAt: z.iso.datetime(),
  })
  .refine((profile) => profile.kyc.status !== 'verified' || profile.nationalId === null, {
    message: 'کد ملی تأییدشده نباید بازگردانده شود',
    path: ['nationalId'],
  });

export type AccountProfile = z.output<typeof accountProfileSchema>;

/** What the profile form may change. The mobile is not among them. */
export const profileUpdateSchema = z.strictObject({
  displayName: userTextSchema(80).nullable(),
  nationalId: iranianNationalIdSchema.nullable(),
});

export type ProfileUpdateInput = z.output<typeof profileUpdateSchema>;

/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * A password for the faster sign-in path.
 *
 * The floor is length, not a character-class puzzle: a rule demanding a symbol
 * produces «Password1!» on every account in the country. What is refused is
 * the two passwords an Iranian shop actually receives — the customer's own
 * mobile number, and a run of digits.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, { message: 'رمز عبور باید حداقل ۸ نویسه باشد' })
  .max(PASSWORD_MAX)
  .refine((value) => !/^\d+$/.test(value), { message: 'رمز عبور نمی‌تواند فقط عدد باشد' });

export const setPasswordSchema = z
  .strictObject({
    password: passwordSchema,
    confirmation: z.string(),
  })
  .refine((input) => input.password === input.confirmation, {
    message: 'دو رمز یکسان نیستند',
    path: ['confirmation'],
  });

export type SetPasswordInput = z.output<typeof setPasswordSchema>;

export const passwordLoginSchema = z.strictObject({
  mobile: iranianMobileSchema,
  password: z.string().min(1).max(PASSWORD_MAX),
});

export type PasswordLoginInput = z.output<typeof passwordLoginSchema>;

/* -------------------------------------------------------------------------- */
/* Delivery addresses                                                         */
/* -------------------------------------------------------------------------- */

/**
 * What the customer calls this address.
 *
 * A closed set, not free text: the label is rendered as a heading on the
 * checkout page and in the courier's manifest, and «خانه» is a key that both
 * of those can translate.
 */
export const addressLabelSchema = z.enum(['home', 'work', 'other']);

export type AddressLabel = z.output<typeof addressLabelSchema>;

/**
 * An Iranian postal code.
 *
 * Ten digits, and not any ten: the first four cannot contain 0 or 2, the fifth
 * cannot be 0, 2 or 5, and an all-same-digit code is never issued. The rule is
 * the post office's, and applying it here turns «۱۰ رقم» from a length check
 * into an actual check.
 */
export const postalCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => /^[13-9]{4}[1346-9][013-9]{5}$/.test(value) && !/^(\d)\1{9}$/.test(value), {
    message: 'کد پستی معتبر نیست',
  });

export const addressSchema = z.object({
  id: uuidSchema,
  label: addressLabelSchema,
  recipientName: userTextSchema(80),
  recipientMobile: iranianMobileSchema,
  province: userTextSchema(40),
  city: userTextSchema(40),
  line: userTextSchema(240),
  plate: userTextSchema(10),
  unit: userTextSchema(10).nullable(),
  postalCode: postalCodeSchema,
  isDefault: z.boolean(),
});

export type Address = z.output<typeof addressSchema>;

/**
 * What an address form submits.
 *
 * `deliverToSelf` is the switch the design draws: when it is on the recipient
 * is the account holder and the server fills the name and number from the
 * profile, so the two fields below it are absent rather than empty. When it is
 * off both are required — which is what the discriminated shape enforces,
 * rather than a pair of optional fields that a request could omit either way.
 */
export const addressDraftSchema = z.discriminatedUnion('deliverToSelf', [
  z.strictObject({
    deliverToSelf: z.literal(true),
    label: addressLabelSchema,
    province: userTextSchema(40),
    city: userTextSchema(40),
    line: userTextSchema(240).refine((value) => value.length >= 10, {
      message: 'نشانی را کامل‌تر بنویسید',
    }),
    plate: userTextSchema(10),
    unit: userTextSchema(10).nullable(),
    postalCode: postalCodeSchema,
    isDefault: z.boolean(),
  }),
  z.strictObject({
    deliverToSelf: z.literal(false),
    label: addressLabelSchema,
    province: userTextSchema(40),
    city: userTextSchema(40),
    line: userTextSchema(240).refine((value) => value.length >= 10, {
      message: 'نشانی را کامل‌تر بنویسید',
    }),
    plate: userTextSchema(10),
    unit: userTextSchema(10).nullable(),
    postalCode: postalCodeSchema,
    isDefault: z.boolean(),
    recipientName: userTextSchema(80).refine((value) => value.length >= 3, {
      message: 'نام تحویل‌گیرنده را کامل وارد کنید',
    }),
    recipientMobile: iranianMobileSchema,
  }),
]);

export type AddressDraft = z.output<typeof addressDraftSchema>;

/* -------------------------------------------------------------------------- */
/* Orders, as the account list shows them                                     */
/* -------------------------------------------------------------------------- */

/**
 * Where an order has got to.
 *
 * The four the customer's list distinguishes. The fuller lifecycle belongs to
 * the order record itself; this is what the badge on a card says.
 */
export const orderStateSchema = z.enum(['processing', 'shipped', 'delivered', 'cancelled']);

export type OrderState = z.output<typeof orderStateSchema>;

/**
 * One row of the order list.
 *
 * `totalRials` is the amount that was actually charged, read from the order's
 * own snapshot. It is never recomputed from today's gold rate: an order from
 * August must still show what August cost.
 */
export const accountOrderSchema = z.object({
  /** The human-facing reference, printed on the invoice. */
  code: z.string().regex(/^ZN-\d{4,10}$/, { message: 'شماره سفارش معتبر نیست' }),
  placedAt: z.iso.datetime(),
  state: orderStateSchema,
  title: userTextSchema(120),
  totalRials: positiveRialsStringSchema,
  /** The product to return to, when the order holds exactly one. */
  productSlug: z.string().max(160).nullable(),
  itemCount: z.int().min(1).max(200),
});

export type AccountOrder = z.output<typeof accountOrderSchema>;

/** The filter chips above the list, parsed from the query string. */
export const orderFilterSchema = z.enum(['all', 'open', 'delivered', 'cancelled']);

export type OrderFilter = z.output<typeof orderFilterSchema>;

/**
 * The filter in the query string.
 *
 * `catch` rather than `default`: an absent filter and an unrecognised one both
 * mean the whole list. The value comes from a link anybody can write, and a
 * page that throws on a typo in a URL is a page somebody can break for a
 * customer by sending them one.
 */
export const orderQuerySchema = z.object({
  filter: orderFilterSchema.catch('all'),
});

export type OrderQuery = z.output<typeof orderQuerySchema>;

/**
 * The order a customer is waiting on right now, with how far it has got.
 *
 * `step` indexes the four-stage progress bar. It is derived on the server from
 * the order's state, so the bar and the badge cannot disagree.
 */
export const activeOrderSchema = z.object({
  code: accountOrderSchema.shape.code,
  step: z.int().min(0).max(3),
});

export type ActiveOrder = z.output<typeof activeOrderSchema>;

/* -------------------------------------------------------------------------- */
/* Devices holding a session                                                  */
/* -------------------------------------------------------------------------- */

export const deviceKindSchema = z.enum(['phone', 'desktop', 'app']);

export type DeviceKind = z.output<typeof deviceKindSchema>;

/**
 * One signed-in device.
 *
 * The name and the place are derived on the server from the user agent and the
 * address the session was created from, and arrive already reduced — «تهران»,
 * not an IP. A page that receives the raw address would put it in the HTML,
 * and there is nothing a customer does with it that is worth that.
 */
export const deviceSessionSchema = z.object({
  id: uuidSchema,
  kind: deviceKindSchema,
  name: userTextSchema(60),
  /** Null when the address the session was created from resolves to nowhere. */
  place: userTextSchema(60).nullable(),
  lastSeenAt: z.iso.datetime(),
  /** True for the session making this request. It has no «sign out» button. */
  isCurrent: z.boolean(),
});

export type DeviceSession = z.output<typeof deviceSessionSchema>;

/* -------------------------------------------------------------------------- */
/* The account home, in one response                                          */
/* -------------------------------------------------------------------------- */

/**
 * Everything the account landing page draws.
 *
 * One shape rather than five requests, because the page is one screen and a
 * customer on a phone should not wait for five round trips to see it.
 */
export const accountOverviewSchema = z.object({
  profile: accountProfileSchema,
  wallet: walletSummarySchema,
  activeOrder: activeOrderSchema.nullable(),
  orderCount: z.int().min(0),
  addressCount: z.int().min(0),
  favouriteCount: z.int().min(0),
  unreadMessageCount: z.int().min(0),
  /** Total weight of gold held, in whole milligrams. */
  goldMilligrams: z.string().regex(/^\d+$/, { message: 'وزن باید عدد صحیح باشد' }),
});

export type AccountOverview = z.output<typeof accountOverviewSchema>;
