/**
 * The skeleton shown while a product is being fetched and priced.
 *
 * It reproduces the shape of the page — header, gallery, title, pickers, price
 * card, buy bar — so nothing jumps when the real content lands. The blocks are
 * tinted panels rather than imitations of the eventual content: a skeleton
 * that pretends to be four specification rows promises a layout the data may
 * not have.
 *
 * The blocks are decorative and stay out of the accessibility tree; the polite
 * status line is what a screen reader is given instead.
 */
export default function ProductLoading() {
  return (
    <div className="zn-shell zn-shell--product" aria-busy="true">
      <div className="zn-pdphead">
        <span className="zn-skel zn-skel--icon" />
        <span className="zn-skel zn-skel--title" />
      </div>

      <p className="sr-only" role="status">
        در حال بارگذاری اطلاعات کالا
      </p>

      <div aria-hidden="true">
        <div className="zn-gallery">
          <div className="zn-skel zn-gallery__frame" />
          <div className="zn-gallery__thumbs">
            {[0, 1, 2, 3].map((thumb) => (
              <span className="zn-skel zn-gallery__thumb" key={thumb} />
            ))}
          </div>
        </div>

        <div className="zn-pdptitle">
          <span className="zn-skel zn-skel--heading" />
          <span className="zn-skel zn-skel--meta" />
        </div>

        <div className="zn-variant">
          <span className="zn-skel zn-skel--label" />
          <div className="zn-variant__row">
            {[0, 1, 2].map((chip) => (
              <span className="zn-skel zn-chip zn-chip--colour" key={chip} />
            ))}
          </div>
        </div>

        <div className="zn-skel zn-skel--pricecard" />
      </div>
    </div>
  );
}
