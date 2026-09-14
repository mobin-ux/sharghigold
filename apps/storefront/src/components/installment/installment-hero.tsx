import Link from 'next/link';
import type { ReactElement } from 'react';

import {
  ArrowIcon,
  ArrowRightIcon,
  DocumentIcon,
  HelpIcon,
  ShieldIcon,
  StarOutlineIcon,
  TruckIcon,
} from '@/components/icons';
import { Mark } from '@/components/marks/mark';
import { routes } from '@/lib/routes';
import type { InstallmentAssurance } from '@/server/content/installment-copy';

/** The sticky bar: back to the homepage, the page's name, and «راهنما». */
export function InstallmentHeader({ title }: { readonly title: string }) {
  return (
    <header className="zn-insthead">
      <Link className="zn-insthead__back" href={routes.home()} aria-label="بازگشت">
        <ArrowRightIcon size={20} />
      </Link>
      <span className="zn-insthead__title">{title}</span>
      <a className="zn-insthead__help" href="#faq">
        <HelpIcon size={15} strokeWidth={1.8} />
        راهنما
      </a>
    </header>
  );
}

/**
 * The teal hero, and the four promises under it.
 *
 * The canvas leaves the hero's picture as an empty image slot. Until there is
 * photography the column carries the bangle mark the catalogue already draws,
 * on a deeper teal, rather than a grey placeholder a customer would read as a
 * picture that failed to load.
 */
export function InstallmentHero({
  badge,
  title,
  lede,
  cta,
  assurances,
}: {
  readonly badge: string;
  readonly title: readonly string[];
  readonly lede: string;
  readonly cta: string;
  readonly assurances: readonly InstallmentAssurance[];
}) {
  return (
    <>
      <section className="zn-insthero" aria-labelledby="installment-title">
        <div className="zn-insthero__copy">
          <span className="zn-insthero__badge">
            <span className="zn-insthero__dot" aria-hidden="true" />
            {badge}
          </span>
          <h1 className="zn-insthero__title" id="installment-title">
            {title.map((line, index) => (
              <span className="zn-insthero__line" key={line}>
                {line}
                {index < title.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="zn-insthero__lede">{lede}</p>
          <a className="zn-insthero__cta" href="#calculator">
            {cta}
            <ArrowIcon size={16} strokeWidth={2.1} />
          </a>
        </div>
        <div className="zn-insthero__art" aria-hidden="true">
          <Mark icon="bangle" size={88} />
        </div>
      </section>

      <ul className="zn-instpromise" aria-label="تضمین‌های خرید اقساطی">
        {assurances.map((item) => (
          <li className="zn-instpromise__item" key={item.lines.join(' ')}>
            <span className="zn-instpromise__icon">{ASSURANCE_ICON[item.icon]}</span>
            <span className="zn-instpromise__text">
              {item.lines[0]}
              <br />
              {item.lines[1]}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

const ASSURANCE_ICON: Partial<Record<InstallmentAssurance['icon'], ReactElement>> = {
  shield: <ShieldIcon size={16} strokeWidth={1.8} />,
  invoice: <DocumentIcon />,
  truck: <TruckIcon size={16} strokeWidth={1.8} />,
  star: <StarOutlineIcon />,
};
