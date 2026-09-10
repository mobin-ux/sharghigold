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
  categoryNavigationEntrySchema,
  categoryNavigationSchema,
  categorySummarySchema,
  facetGroupKindSchema,
  facetGroupSchema,
  facetQuerySchema,
  facetTileSchema,
  iconKeySchema,
  type CategoryNavigation,
  type CategoryNavigationEntry,
  type CategorySummary,
  type FacetGroup,
  type FacetGroupKind,
  type FacetTile,
  type IconKey,
} from './catalogue.js';

export {
  breadcrumbStepSchema,
  goldColourSchema,
  productColourSchema,
  productDetailSchema,
  productMediaSchema,
  productSizeSchema,
  productSpecSchema,
  ratingBucketSchema,
  ratingSummarySchema,
  sizeGuideRowSchema,
  skuSchema,
  starRatingSchema,
  type BreadcrumbStep,
  type GoldColour,
  type ProductColour,
  type ProductDetail,
  type ProductMedia,
  type ProductSize,
  type ProductSpec,
  type RatingSummary,
  type SizeGuideRow,
} from './product.js';

export {
  goldRateSnapshotSchema,
  installmentPlanSchema,
  priceLineKindSchema,
  priceLineSchema,
  priceQuoteSchema,
  type GoldRateSnapshot,
  type InstallmentPlan,
  type PriceLine,
  type PriceLineKind,
  type PriceQuote,
} from './pricing.js';

export {
  aspectRatingSchema,
  aspectScoreSchema,
  contributionIdSchema,
  productQuestionSchema,
  productReviewSchema,
  QUESTION_BODY_MAX,
  QUESTION_BODY_MIN,
  questionAnswerSchema,
  questionSubmissionSchema,
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  reviewAspectSchema,
  reviewFilterSchema,
  reviewPageSchema,
  reviewPhotoSchema,
  reviewQuerySchema,
  reviewSortSchema,
  reviewSubmissionSchema,
  sellerReplySchema,
  type AspectScore,
  type ProductQuestion,
  type ProductReview,
  type QuestionSubmission,
  type ReviewAspect,
  type ReviewFilter,
  type ReviewPage,
  type ReviewQuery,
  type ReviewSort,
  type ReviewSubmission,
} from './reviews.js';

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
