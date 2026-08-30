import React from 'react';
import { cx, stepper } from '../shared/hubStyles';

export interface WizardStep {
  id: number;
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  activeStep: number;
  /** Whether a step other than the active one can be jumped to. */
  isStepNavigable: (id: number) => boolean;
  onStepClick: (id: number) => void;
}

/**
 * The wizard's own stepper: a hairline rail, five index bubbles, the active
 * step in white with an orange index. Done steps are buttons; todo steps are
 * inert text, so the tab order only ever contains places you can actually go.
 */
const WizardStepper: React.FC<WizardStepperProps> = ({ steps, activeStep, isStepNavigable, onStepClick }) => (
  <nav aria-label="Create pass steps">
    <ol className={cx(stepper.rail, 'overflow-x-auto')}>
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isDone = step.id < activeStep;
        const navigable = !isActive && isStepNavigable(step.id);
        const tone = isActive ? 'active' : isDone || navigable ? 'done' : 'todo';

        const indexClass = cx(
          stepper.index,
          tone === 'active' && stepper.indexActive,
          tone === 'done' && stepper.indexDone,
          tone === 'todo' && stepper.indexTodo,
        );
        const stepClass = cx(
          stepper.step,
          'shrink-0 whitespace-nowrap',
          tone === 'active' && stepper.stepActive,
          tone === 'done' && stepper.stepDone,
          tone === 'todo' && stepper.stepTodo,
        );

        return (
          <React.Fragment key={step.id}>
            {index > 0 && <li aria-hidden="true" className={cx(stepper.separator, 'shrink-0')} />}
            <li className="shrink-0" aria-current={isActive ? 'step' : undefined}>
              {navigable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className={cx(
                    stepClass,
                    'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40',
                  )}
                >
                  <span className={indexClass}>{step.id}</span>
                  {step.label}
                </button>
              ) : (
                <span className={stepClass}>
                  <span className={indexClass}>{step.id}</span>
                  {step.label}
                </span>
              )}
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  </nav>
);

export default WizardStepper;
