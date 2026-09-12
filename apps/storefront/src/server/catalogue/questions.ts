/**
 * Buyer questions and the shop's answers.
 *
 * PLACEHOLDER CONTENT behind a real seam, like `reviews.ts`. Names are already
 * shortened to «سارا م.» by the time they get here, and an unanswered question
 * carries a null answer rather than an empty string — «no answer yet» and «the
 * answer is blank» are different facts, and the page says different things
 * about them.
 */
import { productQuestionSchema, type ProductQuestion } from '@sharghigold/contracts';

/** Thrown when the question list cannot be produced in the shape the contract promises. */
export class QuestionContractError extends Error {
  constructor(detail: string) {
    super(`Question list did not match the contract: ${detail}`);
    this.name = 'QuestionContractError';
  }
}

const EXPERT = 'کارشناس زرنما';

const SOLITAIRE_QUESTIONS: readonly ProductQuestion[] = [
  {
    id: 'qa-10482-01',
    body: 'نگین این انگشتر قابل تعویض است؟',
    askedByDisplayName: 'سارا م.',
    askedAt: '2026-08-20T09:10:00.000Z',
    answer: {
      body: 'بله. تعویض نگین در کارگاه زرنما انجام می‌شود؛ هزینه آن به نوع نگین انتخابی بستگی دارد و پیش از انجام کار به شما اعلام می‌شود.',
      author: EXPERT,
      answeredAt: '2026-08-20T11:05:00.000Z',
    },
    helpfulCount: 18,
  },
  {
    id: 'qa-10482-02',
    body: 'اگر سایز مناسب نبود می‌توانم تغییر دهم؟',
    askedByDisplayName: 'رضا ک.',
    askedAt: '2026-08-08T14:30:00.000Z',
    answer: {
      body: 'تغییر سایز رکاب تا دو شماره کوچک‌تر یا بزرگ‌تر رایگان است و حدود سه روز کاری زمان می‌برد. تغییر بیشتر از دو شماره هزینه اجرت جداگانه دارد.',
      author: EXPERT,
      answeredAt: '2026-08-08T16:00:00.000Z',
    },
    helpfulCount: 42,
  },
  {
    id: 'qa-10482-03',
    body: 'قیمت در زمان ثبت سفارش قفل می‌شود؟',
    askedByDisplayName: 'مهدی ت.',
    askedAt: '2026-08-04T18:45:00.000Z',
    answer: {
      body: 'بله. با افزودن کالا به سبد، قیمت به مدت پنج دقیقه قفل می‌شود و در صورت پرداخت در این بازه همان نرخ اعمال می‌گردد.',
      author: EXPERT,
      answeredAt: '2026-08-04T19:20:00.000Z',
    },
    helpfulCount: 36,
  },
  {
    id: 'qa-10482-04',
    body: 'امکان خرید اقساطی این انگشتر وجود دارد؟',
    askedByDisplayName: 'الهام ب.',
    askedAt: '2026-07-15T10:05:00.000Z',
    answer: {
      body: 'بله، با پیش‌پرداخت ۴۰٪ و بازپرداخت ۶ تا ۱۸ ماهه، بدون چک و ضامن. سقف اعتبار پس از اعتبارسنجی آنلاین مشخص می‌شود؛ محاسبه قسط ماهانه در صفحه خرید اقساطی در دسترس است.',
      author: EXPERT,
      answeredAt: '2026-07-15T12:40:00.000Z',
    },
    helpfulCount: 29,
  },
];

const QUESTIONS_BY_SLUG = new Map<string, readonly ProductQuestion[]>([
  ['classic-solitaire-ring', SOLITAIRE_QUESTIONS],
]);

/**
 * Answered questions first and newest first within that, which is the order a
 * customer scanning for an answer wants. `toSorted`, not `sort`: the fixture is
 * shared across every request in the process.
 */
export async function getProductQuestions(slug: string): Promise<readonly ProductQuestion[]> {
  const questions = (QUESTIONS_BY_SLUG.get(slug) ?? []).toSorted((a, b) => {
    const answered = Number(b.answer !== null) - Number(a.answer !== null);
    return answered !== 0 ? answered : Date.parse(b.askedAt) - Date.parse(a.askedAt);
  });

  const parsed = productQuestionSchema.array().safeParse(questions);

  if (!parsed.success) {
    throw new QuestionContractError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }

  return parsed.data;
}

/** How many of a product's questions already have an answer. */
export async function countAnsweredQuestions(slug: string): Promise<number> {
  return (QUESTIONS_BY_SLUG.get(slug) ?? []).filter((question) => question.answer !== null).length;
}
