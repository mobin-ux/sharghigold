'use server';

import {
  reviewAspectSchema,
  reviewSubmissionSchema,
  slugSchema,
  starRatingSchema,
} from '@sharghigold/contracts';

import { getProduct } from '@/server/catalogue/product';
import { postSubmission } from '@/server/catalogue/submissions';

import type { ReviewDraft, WriteState } from './state';

/**
 * Read the submitted form back into a draft.
 *
 * Done before validation and kept whatever the outcome, so a rejected review
 * comes back with everything the customer typed still in the fields. Losing
 * three hundred words to a missed checkbox is how a shop stops getting
 * reviews.
 */
function readDraft(form: FormData): ReviewDraft {
  const text = (key: string) => (typeof form.get(key) === 'string' ? String(form.get(key)) : '');

  const aspects: Record<string, number> = {};
  for (const [key, value] of form.entries()) {
    if (!key.startsWith('aspect.')) continue;
    const parsed = reviewAspectSchema.safeParse(key.slice('aspect.'.length));
    const stars = Number(value);
    if (parsed.success && Number.isInteger(stars)) aspects[parsed.data] = stars;
  }

  return {
    stars: Number(text('stars')) || 0,
    title: text('title'),
    body: text('body'),
    aspects,
    acceptsPolicy: form.get('acceptsPolicy') === 'on',
  };
}

/**
 * Publish a review.
 *
 * The whole submission is re-parsed here against the shared contract. The form
 * checks the same rules as the customer types, which is a courtesy; this is
 * the check that decides (rules 6 and 9). Nothing is trusted from the request:
 * not the star count, not the aspect keys, not the product it claims to be
 * about.
 *
 * A review also needs an identity and a paid order behind it before it can
 * carry «خرید تأییدشده», and neither exists yet — which is the other reason
 * `postSubmission` refuses until an API is configured to make that check.
 */
export async function submitReview(_previous: WriteState, form: FormData): Promise<WriteState> {
  const draft = readDraft(form);

  const slug = slugSchema.safeParse(form.get('slug'));

  const parsed = reviewSubmissionSchema.safeParse({
    stars: starRatingSchema.safeParse(draft.stars).success ? draft.stars : undefined,
    ...(draft.title.trim() === '' ? {} : { title: draft.title }),
    body: draft.body,
    aspects: Object.entries(draft.aspects).map(([aspect, stars]) => ({ aspect, stars })),
    acceptsPolicy: draft.acceptsPolicy ? true : undefined,
  });

  if (!parsed.success) {
    // The first issue only. A wall of messages above a form is read by nobody,
    // and the fields carry their own invalid state.
    const first = parsed.error.issues[0];
    const message =
      first?.path[0] === 'stars'
        ? 'امتیاز کلی را انتخاب کنید'
        : (first?.message ?? 'دیدگاه شما ثبت نشد');

    return { status: 'invalid', message, draft };
  }

  if (!slug.success || (await getProduct(slug.data)) === undefined) {
    return { status: 'invalid', message: 'دیدگاه شما ثبت نشد', draft };
  }

  const result = await postSubmission('/api/v1/reviews', {
    productSlug: slug.data,
    ...parsed.data,
  });

  return result.status === 'accepted' ? { status: 'accepted' } : { status: 'unavailable', draft };
}
