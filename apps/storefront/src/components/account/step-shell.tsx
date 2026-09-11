import { OrderStepper } from '@sharghigold/ui';
import type { KycStepKey } from '@sharghigold/contracts';
import type { ReactNode } from 'react';

import {
  KYC_STEP_HEADING,
  KYC_STEP_LEAD,
  KYC_STEP_NAME,
  KYC_STEP_PATH,
  KYC_STEPS,
  persianCount,
} from '@/lib/account-view';

import { PageHead } from './page-head';

interface StepShellProps {
  readonly step: KycStepKey;
  /**
   * The form. It holds both the fields and the button that submits them,
   * because the button is a submit and the two cannot live in different
   * elements.
   */
  readonly children: ReactNode;
}

/**
 * The frame the three verification steps share.
 *
 * The progress bar is a real `<ol>` with the current stage marked
 * `aria-current`, so «گام ۲ از ۳» is available to a screen reader from the
 * markup and not only from the counter in the corner.
 *
 * Back goes to the previous step, or out to the overview from the first. The
 * design uses the browser's history, which on this flow sends somebody who
 * arrived by link out of the site.
 */
export function StepShell({ step, children }: StepShellProps) {
  const index = KYC_STEPS.indexOf(step);
  const previous = KYC_STEPS[index - 1];
  const back = previous === undefined ? '/account/identity' : KYC_STEP_PATH[previous];

  return (
    <div className="zn-shell zn-flow">
      <PageHead
        title="احراز هویت"
        back={back}
        trailing={`گام ${persianCount(index + 1)} از ${persianCount(KYC_STEPS.length)}`}
      />

      <div className="zn-flow__steps">
        <OrderStepper
          steps={KYC_STEPS.map((key) => KYC_STEP_NAME[key])}
          current={index}
          label="مراحل احراز هویت"
        />
      </div>

      <div className="zn-flow__intro">
        <h1 className="zn-flow__title">{KYC_STEP_HEADING[step]}</h1>
        <p className="zn-flow__lead">{KYC_STEP_LEAD[step]}</p>
      </div>

      {children}
    </div>
  );
}
