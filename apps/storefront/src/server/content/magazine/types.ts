/**
 * The shape of the magazine: topics, authors, and articles built from blocks.
 *
 * An article body is a list of typed blocks, never markup. A content source
 * that returns HTML can put a `<script>` on every reader's page; blocks are
 * data, and the storefront decides which element each one becomes. Emphasis
 * inside a paragraph is a run marked `strong`, which is the only inline
 * formatting the design uses.
 */
import type { PolicyQuestion } from '@/server/policy/shop-policy';

export type TopicId = 'market' | 'guide' | 'installment' | 'authenticity' | 'care' | 'news';

export interface Topic {
  readonly id: TopicId;
  /** The URL segment: `/blog/topics/<slug>`. */
  readonly slug: string;
  readonly label: string;
  readonly description: string;
}

export interface Author {
  readonly slug: string;
  readonly name: string;
  /** «ر.م» — drawn in the avatar disc. */
  readonly initials: string;
  readonly role: string;
  readonly credential: string;
  readonly yearsInMarket: number;
  readonly bio: string;
  readonly specialties: readonly string[];
}

/** A stretch of paragraph text, optionally bold. */
export type Inline = string | { readonly strong: string };

export type ArticleBlock =
  | {
      readonly kind: 'heading';
      /** The fragment the table of contents links to. */
      readonly id: string;
      readonly text: string;
    }
  | { readonly kind: 'paragraph'; readonly runs: readonly Inline[] }
  | { readonly kind: 'list'; readonly items: readonly (readonly Inline[])[] }
  | {
      readonly kind: 'table';
      readonly head: readonly string[];
      readonly rows: readonly {
        readonly cells: readonly string[];
        /** Colours the last cell: a cost that is low, or one that is high. */
        readonly tone?: 'good' | 'bad';
      }[];
      readonly note?: string;
    }
  | { readonly kind: 'quote'; readonly text: string }
  /** Catalogue pieces, by slug; a slug the catalogue no longer has is skipped. */
  | { readonly kind: 'products'; readonly title: string; readonly slugs: readonly string[] }
  /** The instalment calculator panel, worded from the configured terms. */
  | { readonly kind: 'installment' };

export interface Article {
  readonly slug: string;
  readonly topic: TopicId;
  readonly author: string;
  readonly title: string;
  /** One or two sentences: the card text, the meta description and the dek. */
  readonly lede: string;
  /** Persian-calendar date, as printed. */
  readonly published: string;
  /** The same day as ISO 8601, for ordering and `<time>`. */
  readonly publishedAt: string;
  readonly reviewed: string;
  readonly reviewedAt: string;
  readonly readingMinutes: number;
  /**
   * PLACEHOLDER — a stand-in for read counts, ordering «پربازدید». Replaced by
   * analytics; nothing displays the number itself.
   */
  readonly popularity: number;
  /** The one article the magazine home leads with. */
  readonly featured?: true;
  /** A caption under the hero image. */
  readonly imageCaption?: string;
  /** «خلاصه در سه خط». */
  readonly summary?: readonly string[];
  readonly body: readonly ArticleBlock[];
  readonly faqs?: readonly PolicyQuestion[];
  /** Printed only when an editor has real sources to cite. */
  readonly sources?: readonly string[];
}
