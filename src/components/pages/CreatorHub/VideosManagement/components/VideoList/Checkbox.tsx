import React, { useCallback } from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  /** Some, but not all, of the rows below this one are selected. */
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

/**
 * The list's tick box.
 *
 * A native `<input type="checkbox">` paints the operating system's blue square
 * in the middle of a dark panel and cannot be restyled past that on every
 * browser we ship to. This is a button that says it is a checkbox — same
 * semantics for a screen reader, same space-to-toggle, and it looks like the
 * rest of the app.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}) => {
  const handleClick = useCallback(() => onChange(!checked), [checked, onChange]);
  const filled = checked || indeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={handleClick}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border
                  transition-colors duration-150 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-[#fa7517]/40 ${
                    filled
                      ? 'border-[#fa7517] bg-[#fa7517]'
                      : 'border-gray-600 bg-transparent hover:border-gray-400'
                  } ${className ?? ''}`}
    >
      {checked && !indeterminate && (
        <Check className="h-3 w-3 text-black" strokeWidth={3} aria-hidden="true" />
      )}
      {indeterminate && <Minus className="h-3 w-3 text-black" strokeWidth={3} aria-hidden="true" />}
    </button>
  );
};

export default Checkbox;
