'use client';

import { useId, useState } from 'react';

import { ChevronDownIcon } from '@/components/icons';
import type { PolicyQuestion } from '@/server/policy/shop-policy';

/**
 * «پرسش‌های متداول».
 *
 * One panel open at a time, as the canvas has it, and the open one can be
 * closed — an accordion where the last panel cannot be shut leaves the reader
 * unable to see the list as a list.
 *
 * Every panel is rendered and hidden rather than mounted on demand, so the
 * answers are in the page source: these are the questions people search for,
 * and an answer that only exists after a click is an answer no crawler finds.
 */
export function FaqAccordion({ questions }: { readonly questions: readonly PolicyQuestion[] }) {
  const baseId = useId();
  const [open, setOpen] = useState(0);

  return (
    <section className="zn-faq" aria-labelledby="faq">
      <h2 className="zn-faq__title" id="faq">
        پرسش‌های متداول
      </h2>

      <div className="zn-faq__list">
        {questions.map((entry, index) => {
          const panelId = `${baseId}-answer-${String(index)}`;
          const buttonId = `${baseId}-question-${String(index)}`;
          const isOpen = open === index;

          return (
            <div className="zn-faq__item" key={entry.question}>
              <h3 className="zn-faq__heading">
                <button
                  className="zn-faq__button"
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span>{entry.question}</span>
                  <span className={`zn-faq__chev${isOpen ? ' zn-faq__chev--open' : ''}`}>
                    <ChevronDownIcon size={16} />
                  </span>
                </button>
              </h3>

              <p
                className="zn-faq__answer"
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
              >
                {entry.answer}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
