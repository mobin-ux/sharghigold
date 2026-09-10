'use server';

import { questionSubmissionSchema, slugSchema } from '@sharghigold/contracts';

import { getProduct } from '@/server/catalogue/product';
import { postSubmission } from '@/server/catalogue/submissions';

/**
 * What the question form gets back.
 *
 * A discriminated union rather than a thrown error: «you typed too little» and
 * «we cannot take questions right now» are different things and the page says
 * different things about them.
 */
export type AskState =
  | { readonly status: 'idle' }
  | { readonly status: 'invalid'; readonly message: string; readonly body: string }
  | { readonly status: 'unavailable'; readonly body: string }
  | { readonly status: 'accepted' };

/**
 * Ask a question about a product.
 *
 * Everything that matters happens here, on the server. The form runs the same
 * schema while the customer types, but that is a convenience: this re-parses
 * the submission from scratch and is the only check that counts (rules 6
 * and 9). The slug is re-parsed too and matched against the catalogue, so a
 * hand-posted form cannot attach a question to something that does not exist.
 *
 * The error text handed back is the schema's own Persian message. Nothing from
 * an exception, a stack or a fetch failure is ever returned — those name
 * internal hosts and code paths.
 */
export async function askQuestion(_previous: AskState, form: FormData): Promise<AskState> {
  const body = typeof form.get('body') === 'string' ? String(form.get('body')) : '';

  const slug = slugSchema.safeParse(form.get('slug'));
  const parsed = questionSubmissionSchema.safeParse({ body });

  if (!parsed.success) {
    return {
      status: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'پرسش شما ثبت نشد',
      body,
    };
  }

  if (!slug.success || (await getProduct(slug.data)) === undefined) {
    // Deliberately the same shape as a validation failure. Telling an
    // anonymous caller which slugs exist is a catalogue enumeration they did
    // not need.
    return { status: 'invalid', message: 'پرسش شما ثبت نشد', body };
  }

  const result = await postSubmission('/api/v1/questions', {
    productSlug: slug.data,
    ...parsed.data,
  });

  return result.status === 'accepted' ? { status: 'accepted' } : { status: 'unavailable', body };
}
