/**
 * SMS sign-up.
 *
 * A plain form posting to a route that does not exist yet, and it says so: the
 * button is disabled and the panel carries a note. The alternative — a button
 * that looks live and silently does nothing — is the kind of thing that gets
 * shipped and then discovered by a customer.
 *
 * `type="tel"` with `inputMode="numeric"` brings up the number pad on a phone.
 * `dir="ltr"` on the field is deliberate: a phone number is a left-to-right
 * sequence even in Persian text, and without it the digits and any leading
 * zero reorder as they are typed.
 */
export function Newsletter() {
  return (
    <section className="zn-news" aria-labelledby="newsletter-heading">
      <h2 className="zn-news__title" id="newsletter-heading">
        از تازه‌ها باخبر شوید
      </h2>
      <p className="zn-news__lede">هر هفته یک پیامک از مدل‌های تازه و تخفیف اجرت.</p>

      <form className="zn-news__form" action="/newsletter" method="post">
        <label className="sr-only" htmlFor="newsletter-phone">
          شماره موبایل
        </label>
        <input
          className="zn-news__input"
          id="newsletter-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          aria-describedby="newsletter-status"
          disabled
        />
        <button className="zn-news__submit" type="submit" disabled>
          عضویت
        </button>
      </form>

      <p className="zn-news__status" id="newsletter-status">
        این بخش هنوز فعال نیست و به‌زودی راه‌اندازی می‌شود.
      </p>
    </section>
  );
}
