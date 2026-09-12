/**
 * The placeholder a listing shows while the server is working.
 *
 * Its job is not decoration. A route that reads query parameters is rendered
 * per request, so `next/link` cannot prefetch its content — but it *can*
 * prefetch this, and showing it the instant a link is tapped is the difference
 * between a shop that feels immediate and one that appears to hang on a slow
 * connection while the previous page sits there.
 *
 * It is shaped like what replaces it: a heading, a row of chips and a grid of
 * cards at the card's own proportions. A spinner in the middle of an empty
 * page tells a customer nothing about what is coming, and the layout jumps
 * when it arrives.
 *
 * `aria-hidden` with a single live message: a screen reader should hear «در
 * حال بارگذاری» once, not read out a dozen empty boxes.
 */
export function LoadingGrid({ cards = 6 }: { readonly cards?: number }) {
  return (
    <div className="zn-skel">
      <p className="sr-only" role="status">
        در حال بارگذاری…
      </p>

      <div aria-hidden="true">
        <div className="zn-skel__line zn-skel__line--title" />
        <div className="zn-skel__line zn-skel__line--note" />

        <div className="zn-skel__chips">
          {Array.from({ length: 4 }, (_, index) => (
            <span className="zn-skel__chip" key={index} />
          ))}
        </div>

        <ul className="zn-grid zn-skel__grid">
          {Array.from({ length: cards }, (_, index) => (
            <li className="zn-skel__card" key={index}>
              <span className="zn-skel__media" />
              <span className="zn-skel__line zn-skel__line--short" />
              <span className="zn-skel__line zn-skel__line--tiny" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
