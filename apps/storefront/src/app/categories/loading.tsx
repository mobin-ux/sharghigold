/**
 * The skeleton shown while the catalogue is being fetched.
 *
 * It reproduces the shell — search bar, rail, panel, tab bar — so the page
 * does not jump when the real content lands. The moving parts are just tinted
 * blocks: a skeleton that tries to look like the eventual tiles ends up
 * promising a layout the data may not have.
 *
 * `aria-busy` with a polite status is what a screen reader needs here; the
 * blocks themselves are decorative and stay out of the tree.
 */
export default function CategoriesLoading() {
  return (
    <div className="zn-appshell" aria-busy="true">
      <div className="zn-catsearch">
        <span className="zn-skel zn-catsearch__back" />
        <span className="zn-skel zn-catsearch__field" />
      </div>

      <div className="zn-appshell__body">
        <p className="sr-only" role="status">
          در حال بارگذاری دسته‌بندی‌ها
        </p>

        <div className="zn-catbrowse" aria-hidden="true">
          <div className="zn-catpanel">
            <div className="zn-catpanel__head">
              <span className="zn-catpanel__head-text">
                <span className="zn-skel zn-skel--title" />
                <span className="zn-skel zn-skel--meta" />
              </span>
            </div>

            {[0, 1].map((group) => (
              <div className="zn-facet" key={group}>
                <div className="zn-facet__toggle">
                  <span className="zn-skel zn-skel--heading" />
                </div>
                <div className="zn-facet__grid">
                  {[0, 1, 2, 3, 4, 5].map((tile) => (
                    <span className="zn-tile" key={tile}>
                      <span className="zn-skel zn-tile__mark" />
                      <span className="zn-skel zn-skel--label" />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="zn-catrail">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <span className="zn-catrail__item" key={item}>
                <span className="zn-skel zn-skel--mark" />
                <span className="zn-skel zn-skel--label" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
