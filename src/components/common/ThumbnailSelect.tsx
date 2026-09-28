import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string; disabled: boolean };

function collectOptions(children: React.ReactNode): Option[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) {
      return collectOptions((child.props as { children?: React.ReactNode }).children);
    }
    if (child.type !== "option") return [];
    const props = child.props as {
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    };
    const label = React.Children.toArray(props.children).join("");
    return [{
      value: String(props.value ?? label),
      label,
      disabled: Boolean(props.disabled),
    }];
  });
}

/** A keyboard-accessible menu with the same controlled API as our former selects. */
export function StudioSelect({
  value,
  onChange,
  children,
  disabled = false,
  className = "",
  required = false,
  "aria-label": ariaLabel,
}: {
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  "aria-label"?: string;
}) {
  const options = collectOptions(children);
  const selected = options.find((option) => option.value === String(value));

  return (
    <Listbox
      value={String(value)}
      disabled={disabled}
      onChange={(next: string) =>
        onChange({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>)
      }
    >
      <div className="relative min-w-0">
        <ListboxButton
          aria-label={ariaLabel}
          aria-required={required || undefined}
          className={`group flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#18181b] px-3 py-2 text-left text-sm text-white transition-colors hover:border-white/35 focus:outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className="min-w-0 truncate">{selected?.label ?? "Choose an option"}</span>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            className="shrink-0 text-zinc-400 transition-transform group-data-[open]:rotate-180 group-data-[open]:text-orange-400"
          />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom start", gap: 6 }}
          className="z-[100] max-h-64 min-w-[var(--button-width)] overflow-auto rounded-xl border border-white/15 bg-[#202023] p-1.5 text-sm text-white shadow-[0_20px_48px_rgba(0,0,0,.6)] focus:outline-none [--anchor-padding:12px]"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-zinc-200 outline-none transition-colors data-[focus]:bg-white/10 data-[focus]:text-white data-[selected]:text-orange-300 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
            >
              <span className="truncate">{option.label}</span>
              <Check size={15} aria-hidden="true" className="shrink-0 text-orange-400 opacity-0 group-data-[selected]:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
