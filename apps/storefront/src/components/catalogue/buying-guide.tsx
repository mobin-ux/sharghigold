/** The short buying guide under a category listing. Plain text, never markup. */
export function BuyingGuide({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <section className="zn-guide">
      <h2 className="zn-guide__title">{title}</h2>
      <p className="zn-guide__body">{body}</p>
    </section>
  );
}
