import Link from 'next/link';
import type { ProductSummary } from '@sharghigold/contracts';

import { ChevronDownIcon } from '@/components/icons';
import { ProductTile } from '@/components/home/product-tile';
import { INSTALLMENT_MAX_MONTHS } from '@/config/commerce-terms';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import type { Article, ArticleBlock, Author, Inline } from '@/server/content/magazine';
import type { PolicyQuestion } from '@/server/policy/shop-policy';

/*
 * The pieces of an article page. The body is rendered block by block from
 * typed data; nothing here accepts markup.
 */

/** Title, dek, and the byline row with publication and review dates. */
export function ArticleHeading({
  article,
  author,
}: {
  readonly article: Article;
  readonly author: Author | undefined;
}) {
  return (
    <header className="zn-maghero">
      <h1 className="zn-maghero__title">{article.title}</h1>
      <p className="zn-maghero__dek">{article.lede}</p>
      <div className="zn-magbyline">
        {author === undefined ? null : (
          <>
            <Link
              className="zn-magavatar zn-magavatar--md"
              href={routes.blogAuthor(author.slug)}
              aria-label={`نوشته‌های ${author.name}`}
            >
              {author.initials}
            </Link>
            <span className="zn-magbyline__who">
              <Link className="zn-magbyline__name" href={routes.blogAuthor(author.slug)}>
                {author.name}
              </Link>
              <span className="zn-magbyline__role">{author.role}</span>
            </span>
          </>
        )}
        <span className="zn-magbyline__dates">
          <span className="zn-magbyline__date">
            انتشار <time dateTime={article.publishedAt}>{article.published}</time>
          </span>
          <span className="zn-magbyline__date">
            بازبینی <time dateTime={article.reviewedAt}>{article.reviewed}</time>
            {` · ${persianCount(article.readingMinutes)} دقیقه`}
          </span>
        </span>
      </div>
    </header>
  );
}

/** «فهرست مطالب», open by default, linking to each heading and the questions. */
export function TableOfContents({
  entries,
  hasFaq,
}: {
  readonly entries: readonly { readonly id: string; readonly text: string }[];
  readonly hasFaq: boolean;
}) {
  if (entries.length === 0) return null;

  return (
    <details className="zn-magtoc" open>
      <summary className="zn-magtoc__head">
        فهرست مطالب
        <span className="zn-magchev zn-magtoc__chev">
          <ChevronDownIcon size={16} strokeWidth={2} />
        </span>
      </summary>
      <ol className="zn-magtoc__list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`}>{entry.text}</a>
          </li>
        ))}
        {hasFaq ? (
          <li>
            <a href="#faq">پرسش‌های پرتکرار</a>
          </li>
        ) : null}
      </ol>
    </details>
  );
}

/** «خلاصه در سه خط». */
export function ArticleSummary({ points }: { readonly points: readonly string[] }) {
  return (
    <aside className="zn-magsummary" aria-labelledby="summary-title">
      <h2 className="zn-magsummary__title" id="summary-title">
        خلاصه در سه خط
      </h2>
      <ul className="zn-magsummary__list">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </aside>
  );
}

function Runs({ runs }: { readonly runs: readonly Inline[] }) {
  return runs.map((run, index) =>
    // Runs are positional pieces of one sentence; their order is their identity.
    // oxlint-disable-next-line no-array-index-key
    typeof run === 'string' ? run : <strong key={index}>{run.strong}</strong>,
  );
}

/**
 * The body, grouped into prose runs and full-width panels.
 *
 * Consecutive text blocks share one `.zn-magprose` column, as the canvas
 * groups them; a product or instalment panel breaks the column, because it
 * is drawn edge to edge within the page gutter rather than inside the prose.
 */
export function ArticleBody({
  blocks,
  products,
}: {
  readonly blocks: readonly ArticleBlock[];
  /** Cards for every slug the body names, keyed by slug. */
  readonly products: ReadonlyMap<string, ProductSummary>;
}) {
  const groups: (readonly ArticleBlock[])[] = [];

  for (const block of blocks) {
    const panel = block.kind === 'products' || block.kind === 'installment';
    const last = groups.at(-1);
    const lastIsPanel = last?.[0]?.kind === 'products' || last?.[0]?.kind === 'installment';

    if (panel || last === undefined || lastIsPanel) groups.push([block]);
    else groups[groups.length - 1] = [...last, block];
  }

  return groups.map((group, index) => {
    const head = group[0];
    const key = `group-${String(index)}`;

    if (head?.kind === 'products') {
      const cards = head.slugs.flatMap((slug) => {
        const card = products.get(slug);
        return card === undefined ? [] : [card];
      });
      return cards.length === 0 ? null : (
        <ProductsPanel key={key} title={head.title} cards={cards} />
      );
    }

    if (head?.kind === 'installment') return <InstallmentPanel key={key} />;

    return (
      <div className={`zn-magprose${index === 0 ? '' : ' zn-magprose--after'}`} key={key}>
        {group.map((block, position) => (
          // Blocks are an ordered document; position is the only key they have.
          // oxlint-disable-next-line no-array-index-key
          <ProseBlock block={block} key={position} />
        ))}
      </div>
    );
  });
}

function ProseBlock({ block }: { readonly block: ArticleBlock }) {
  switch (block.kind) {
    case 'heading':
      return <h2 id={block.id}>{block.text}</h2>;
    case 'paragraph':
      return (
        <p>
          <Runs runs={block.runs} />
        </p>
      );
    case 'list':
      return (
        <ul>
          {block.items.map((item, index) => (
            // oxlint-disable-next-line no-array-index-key
            <li key={index}>
              <Runs runs={item} />
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <>
          <div
            className="zn-magtable"
            tabIndex={0}
            role="region"
            aria-label={block.head.join('، ')}
          >
            <table>
              <thead>
                <tr>
                  {block.head.map((cell) => (
                    <th key={cell} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.cells.join('|')}>
                    {row.cells.map((cell, index) => (
                      <td
                        // oxlint-disable-next-line no-array-index-key
                        key={index}
                        className={
                          index === row.cells.length - 1 && row.tone !== undefined
                            ? `zn-magtable__${row.tone}`
                            : undefined
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.note === undefined ? null : <p className="zn-magtable__note">{block.note}</p>}
        </>
      );
    case 'quote':
      return <blockquote>{block.text}</blockquote>;
    default:
      return null;
  }
}

function ProductsPanel({
  title,
  cards,
}: {
  readonly title: string;
  readonly cards: readonly ProductSummary[];
}) {
  return (
    <section className="zn-magproducts" aria-label={title}>
      <span className="zn-magproducts__title">{title}</span>
      {cards.map((card) => (
        <div className="zn-magproducts__item" key={card.slug}>
          <ProductTile product={card} />
          <div className="zn-magproducts__actions">
            <Link className="zn-magbtn zn-magbtn--gold" href={routes.product(card.slug)}>
              مشاهده و خرید
            </Link>
            {card.installment ? (
              <Link className="zn-magbtn zn-magbtn--ghost" href={routes.installment()}>
                خرید اقساطی
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}

/** The instalment panel, worded from the configured terms. */
function InstallmentPanel() {
  return (
    <section className="zn-maginst" aria-labelledby="article-installment">
      <h2 className="zn-maginst__title" id="article-installment">
        قیمت امروز را قفل کنید
      </h2>
      <p className="zn-maginst__body">
        {`با محاسبه‌گر اقساط ببینید قسط ماهانه شما چقدر می‌شود — بدون چک و ضامن، تا ${persianCount(INSTALLMENT_MAX_MONTHS)} ماه.`}
      </p>
      <Link className="zn-magbtn zn-magbtn--gold zn-magbtn--inline" href={routes.installment()}>
        محاسبه قسط ماهانه
      </Link>
    </section>
  );
}

/** «پرسش‌های پرتکرار», as native disclosures. */
export function ArticleFaq({ questions }: { readonly questions: readonly PolicyQuestion[] }) {
  return (
    <section className="zn-magsec zn-magsec--anchor" id="faq" aria-labelledby="faq-title">
      <h2 className="zn-magsec__title" id="faq-title">
        پرسش‌های پرتکرار
      </h2>
      <div className="zn-magfaq">
        {questions.map((entry) => (
          <details className="zn-magfaq__item" key={entry.question}>
            <summary className="zn-magfaq__q">
              {entry.question}
              <span className="zn-magchev zn-magfaq__chev">
                <ChevronDownIcon size={16} strokeWidth={2} />
              </span>
            </summary>
            <p className="zn-magfaq__a">{entry.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Sources when an editor has them, and the investment disclaimer always. */
export function ArticleSources({
  sources,
  disclaimer,
}: {
  readonly sources: readonly string[] | undefined;
  readonly disclaimer: string;
}) {
  const hasSources = sources !== undefined && sources.length > 0;

  return (
    <section className="zn-magsec" aria-label={hasSources ? 'منابع' : 'یادداشت'}>
      {hasSources ? (
        <>
          <h2 className="zn-magsec__title zn-magsec__title--sm">منابع</h2>
          <ol className="zn-magsources">
            {sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ol>
        </>
      ) : null}
      <p className={`zn-magdisclaimer${hasSources ? '' : ' zn-magdisclaimer--solo'}`}>
        {disclaimer}
      </p>
    </section>
  );
}

/** The author card at the end of an article. */
export function AuthorBox({ author }: { readonly author: Author }) {
  return (
    <section className="zn-magsec zn-magsec--author" aria-label="درباره نویسنده">
      <div className="zn-magauthorbox">
        <Link
          className="zn-magavatar zn-magavatar--lg"
          href={routes.blogAuthor(author.slug)}
          aria-label={`نوشته‌های ${author.name}`}
        >
          {author.initials}
        </Link>
        <div className="zn-magauthorbox__body">
          <span className="zn-magauthorbox__name">{author.name}</span>
          <span className="zn-magauthorbox__role">{author.role}</span>
          <p className="zn-magauthorbox__bio">{author.bio}</p>
          <Link className="zn-magbtn zn-magbtn--outline" href={routes.blogAuthor(author.slug)}>
            همه نوشته‌ها
          </Link>
        </div>
      </div>
    </section>
  );
}
