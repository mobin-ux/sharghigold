/**
 * @sharghigold/contracts — the API contract, shared by server and client.
 *
 * These schemas are the single definition of what the system accepts and
 * returns. The API parses requests with them; the storefront validates forms
 * and types responses with them. Because both sides import the same object,
 * the contract cannot silently drift.
 *
 * Client-side use is a convenience for fast feedback, never a control: the
 * server re-parses everything it receives.
 */

export {
  basisPointsSchema,
  iranianMobileSchema,
  iranianNationalIdSchema,
  isValidIranianNationalId,
  karatSchema,
  milligramsStringSchema,
  otpCodeSchema,
  positiveRialsStringSchema,
  rialsStringSchema,
  slugSchema,
  stripControlCharacters,
  userTextSchema,
  uuidSchema,
  type IranianMobile,
  type Karat,
} from './primitives.js';

export {
  API_ERROR_CODES,
  API_ERROR_STATUS,
  apiErrorCodeSchema,
  apiErrorSchema,
  apiFailureSchema,
  apiResponseSchema,
  apiSuccessSchema,
  fieldErrorSchema,
  type ApiError,
  type ApiErrorCode,
  type ApiFailure,
  type ApiResponse,
  type ApiSuccess,
  type FieldError,
} from './api.js';

export {
  buildPageMeta,
  cursorPagedSchema,
  cursorQuerySchema,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  pageMetaSchema,
  pageQuerySchema,
  pagedSchema,
  sortDirectionSchema,
  sortQuerySchema,
  type CursorQuery,
  type PageMeta,
  type PageQuery,
  type SortDirection,
} from './pagination.js';

export {
  currentSessionSchema,
  requestOtpResultSchema,
  requestOtpSchema,
  sessionUserSchema,
  verifyOtpResultSchema,
  verifyOtpSchema,
  type CurrentSession,
  type RequestOtpInput,
  type RequestOtpResult,
  type SessionUser,
  type VerifyOtpInput,
  type VerifyOtpResult,
} from './auth.js';
