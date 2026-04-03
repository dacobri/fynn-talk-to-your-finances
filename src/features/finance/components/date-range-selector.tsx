'use client';

import * as React from 'react';
import { format, subMonths, subYears, startOfMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { DateRange } from 'react-day-picker';

export type DateRangePreset = 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'max' | 'custom';

export interface DateRangeValue {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  preset: DateRangePreset;
}

// Database spans 2020-01-01 to 2024-12-31
const DATA_END = new Date(2024, 11, 31);
const DATA_START = new Date(2020, 0, 1);

function getPresetRange(preset: DateRangePreset): { start: Date; end: Date } {
  const end = DATA_END;
  switch (preset) {
    case 'last-month':
      return { start: startOfMonth(end), end };
    case 'last-3-months':
      return { start: subMonths(startOfMonth(end), 2), end };
    case 'last-6-months':
      return { start: subMonths(startOfMonth(end), 5), end };
    case 'last-year':
      return { start: subYears(startOfMonth(end), 1), end };
    case 'max':
    default:
      return { start: DATA_START, end };
  }
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Last month', value: 'last-month' },
  { label: 'Last 3 months', value: 'last-3-months' },
  { label: 'Last 6 months', value: 'last-6-months' },
  { label: 'Last year', value: 'last-year' },
  { label: 'Max', value: 'max' },
];

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

const DEFAULT_PRESET: DateRangePreset = 'last-month';

export function getDefaultDateRange(): DateRangeValue {
  const { start, end } = getPresetRange(DEFAULT_PRESET);
  return { start: toDateStr(start), end: toDateStr(end), preset: DEFAULT_PRESET };
}

interface DateRangeSelectorProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(undefined);

  // ── Ref tracks clicks synchronously (no React batching delay) ──────
  // This is the key fix: React state updates are async, so when Radix
  // fires onOpenChange(false) after a day click, the state may still be
  // stale. A ref updates instantly in the same event loop tick.
  const selectCountRef = React.useRef(0);

  const handlePreset = (preset: DateRangePreset) => {
    const { start, end } = getPresetRange(preset);
    onChange({ start: toDateStr(start), end: toDateStr(end), preset });
  };

  const handleCustomSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    selectCountRef.current += 1;

    // Only close and apply after the SECOND click when both dates exist
    if (selectCountRef.current >= 2 && range?.from && range?.to) {
      onChange({
        start: toDateStr(range.from),
        end: toDateStr(range.to),
        preset: 'custom',
      });
      selectCountRef.current = 0;
      setCalendarOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && selectCountRef.current === 1) {
      // First date picked — Radix is trying to close the popover.
      // Block it so the user can pick the end date.
      return;
    }
    if (open) {
      // Reset everything when the calendar opens
      setCustomRange(undefined);
      selectCountRef.current = 0;
    }
    setCalendarOpen(open);
  };

  const displayLabel =
    value.preset === 'custom'
      ? `${format(new Date(value.start), 'MMM d, yyyy')} – ${format(new Date(value.end), 'MMM d, yyyy')}`
      : PRESETS.find((p) => p.value === value.preset)?.label ?? 'Last month';

  return (
    <div className='flex items-center gap-1.5 flex-wrap'>
      {PRESETS.map((preset) => (
        <Button
          key={preset.value}
          variant={value.preset === preset.value ? 'default' : 'outline'}
          size='sm'
          className='h-7 text-xs'
          onClick={() => handlePreset(preset.value)}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={calendarOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant={value.preset === 'custom' ? 'default' : 'outline'}
            size='sm'
            className='h-7 text-xs gap-1'
          >
            <Icons.calendar className='h-3 w-3' />
            {value.preset === 'custom' ? displayLabel : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={customRange}
            onSelect={handleCustomSelect}
            numberOfMonths={2}
            defaultMonth={new Date(2024, 10)}
            fromDate={DATA_START}
            toDate={DATA_END}
            fixedWeeks
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
