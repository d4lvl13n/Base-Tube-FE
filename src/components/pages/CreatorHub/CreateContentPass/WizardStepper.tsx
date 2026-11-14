import React from 'react';
import { Check } from 'lucide-react';
import { cx, stepper } from '../Business/businessStyles';

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
 * Where you are, what is done, what is left. The active step is the one orange
 * disc; done steps carry a check and are buttons; steps still ahead are plain
 * text, so the tab order only holds places you can actually go. On a phone only
 * the current step keeps its label and a line above says "Step 2 of 5".
 */
const WizardStepper: React.FC<WizardStepperProps> = ({ steps, activeStep, isStepNavigable, onStepClick }) => {
  const current = steps.find((step) => step.id === activeStep);

  return (
    <nav aria-label="Create pass steps" className="space-y-2">
      <p className="text-xs text-gray-400 sm:hidden" aria-hidden="true">
        Step <span className="tabular-nums">{activeStep}</span> of <span className="tabular-nums">{steps.length}</span>
        {current ? ` · ${current.label}` : ''}
      </p>
      <ol className={stepper.rail}>
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
            tone === 'active' && stepper.stepActive,
            tone === 'done' && stepper.stepDone,
            tone === 'todo' && stepper.stepTodo,
          );
          const content = (
            <>
              <span className={indexClass} aria-hidden="true">
                {isDone ? <Check className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span className={cx(!isActive && 'sr-only sm:not-sr-only')}>{step.label}</span>
              {isDone && <span className="sr-only"> (done)</span>}
            </>
          );

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <li aria-hidden="true" className={step.id <= activeStep ? stepper.separatorDone : stepper.separator} />
              )}
              <li className="shrink-0" aria-current={isActive ? 'step' : undefined}>
                {navigable ? (
                  <button type="button" onClick={() => onStepClick(step.id)} className={stepClass}>
                    {content}
                  </button>
                ) : (
                  <span className={stepClass}>{content}</span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default WizardStepper;
