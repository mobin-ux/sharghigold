import { CheckIcon } from '@/components/icons';
import { flashMessage } from '@/lib/account-view';

/**
 * The confirmation that follows a write.
 *
 * The design floats a toast for two and a half seconds. Here the message
 * arrives in the URL after a redirect, which means it survives the navigation,
 * is read by a screen reader on arrival, and is still on screen for somebody
 * who looks up a moment later.
 *
 * `flashMessage` resolves a key from a fixed table. The URL never carries the
 * sentence itself: a page that prints arbitrary query text is a phishing page
 * hosted on the shop's own domain, and no amount of escaping makes «حساب شما
 * مسدود شد، با این شماره تماس بگیرید» safe to render because a stranger put it
 * in a link.
 */
export function Flash({ code }: { readonly code: string | undefined }) {
  const message = flashMessage(code);
  if (message === undefined) return null;

  return (
    <p className="zn-flash" role="status">
      <CheckIcon size={18} strokeWidth={2.2} />
      {message}
    </p>
  );
}
