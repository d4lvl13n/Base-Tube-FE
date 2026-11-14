import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cx, field, segmented, sheen, surface, text } from '../Business/businessStyles';

/**
 * The wizard's form vocabulary, on the Business / Analytics system: a black
 * card per idea with its title and one line saying why it matters, labels
 * above fields, help under them, errors inline with an icon. No grey fills.
 */

export const wizardInput = cx(field.input, 'h-10');
export const wizardInputInvalid = 'border-red-500/60 hover:border-red-500/70 focus-visible:border-red-400/70 focus-visible:ring-red-500/25';

interface WizardCardProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right side of the title row (a count, an inline action). */
  aside?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const WizardCard: React.FC<WizardCardProps> = ({ id, title, description, aside, className, bodyClassName, style, children }) => (
  <section className={cx(surface.card, className)} aria-labelledby={title && id ? `${id}-title` : undefined} style={style}>
    <div className={sheen} aria-hidden="true" />
    <div className={cx('relative p-5 md:p-6', bodyClassName)}>
      {(title || aside) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className={text.cardTitle}>
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm leading-relaxed text-gray-400">{description}</p>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      )}
      {children}
    </div>
  </section>
);

export const FieldLabel: React.FC<{ htmlFor?: string; id?: string; children: React.ReactNode; hint?: React.ReactNode }> = ({
  htmlFor,
  id,
  children,
  hint,
}) => (
  <div className="mb-1.5 flex items-baseline justify-between gap-3">
    {htmlFor ? (
      <label id={id} htmlFor={htmlFor} className="text-sm font-medium text-gray-200">
        {children}
      </label>
    ) : (
      <span id={id} className="text-sm font-medium text-gray-200">
        {children}
      </span>
    )}
    {hint && <span className="text-xs tabular-nums text-gray-400">{hint}</span>}
  </div>
);

export const FieldHelp: React.FC<{ id?: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => (
  <p id={id} className={cx('mt-1.5 text-xs leading-relaxed text-gray-400', className)}>
    {children}
  </p>
);

export const FieldError: React.FC<{ id?: string; children?: React.ReactNode }> = ({ id, children }) =>
  children ? (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300" role="alert">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  ) : null;

interface PresetChipsProps<T extends string | number> {
  label: string;
  options: readonly T[];
  value: T | undefined | null;
  onSelect: (value: T) => void;
  format?: (value: T) => React.ReactNode;
  className?: string;
}

/** A row of one-tap choices (prices, numbers of passes). The chosen one is orange. */
export function PresetChips<T extends string | number>({ label, options, value, onSelect, format, className }: PresetChipsProps<T>) {
  return (
    <div className={cx(segmented.trough, 'flex-wrap', className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={String(option)}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={cx(segmented.chip, 'tabular-nums', active ? segmented.chipActive : segmented.chipIdle)}
          >
            {format ? format(option) : String(option)}
          </button>
        );
      })}
    </div>
  );
}

/** Joins the ids a field is described by, skipping the absent ones. */
export const describedBy = (...ids: Array<string | false | null | undefined>): string | undefined => {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
};
