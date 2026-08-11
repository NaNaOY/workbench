import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function AppSelect({ value, options, onChange, ariaLabel }: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('below');
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  function selectOption(nextValue: string) {
    setOpen(false);
    onChange(nextValue);
  }

  useEffect(() => {
    setOpen(false);
  }, [value]);

  useLayoutEffect(() => {
    if (!open) return;

    let frame = 0;
    const updatePlacement = () => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;

      const triggerRect = root.getBoundingClientRect();
      const viewportGap = 12;
      const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - viewportGap);
      const spaceAbove = Math.max(0, triggerRect.top - viewportGap);
      const desiredHeight = Math.min(menu.scrollHeight, 320);
      const shouldOpenAbove = spaceBelow < Math.min(desiredHeight, 220) && spaceAbove > spaceBelow;
      const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;

      setPlacement(shouldOpenAbove ? 'above' : 'below');
      setMenuStyle({ maxHeight: Math.max(72, Math.min(320, availableSpace)) });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePlacement);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [open, options.length]);

  return (
    <div
      ref={rootRef}
      data-placement={placement}
      className={`app-select ${open ? 'is-open' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="app-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div ref={menuRef} className="app-select-menu" role="listbox" aria-label={ariaLabel} style={menuStyle}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={option.value === value ? 'selected' : ''}
              onClick={() => selectOption(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
