'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';

type Preference = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  /** 'number' for amount inputs, 'select' for dropdowns, undefined for toggle-only */
  controlType?: 'number' | 'select';
  value?: number | string;
  unit?: string;
  placeholder?: string;
  selectOptions?: { value: string; label: string }[];
};

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const DEFAULT_PREFERENCES: Preference[] = [
  {
    key: 'spending-alerts',
    label: 'Spending alerts',
    description: 'Get notified when category spending exceeds a threshold',
    enabled: true,
    controlType: 'number',
    value: 5000,
    unit: '€/mo',
    placeholder: '5000',
  },
  {
    key: 'large-transaction',
    label: 'Large transaction alerts',
    description: 'Alert when a single transaction exceeds an amount',
    enabled: true,
    controlType: 'number',
    value: 200,
    unit: '€ min',
    placeholder: '200',
  },
  {
    key: 'subscription-renewal',
    label: 'Subscription renewal reminders',
    description: 'Remind you before a subscription renews',
    enabled: true,
    controlType: 'number',
    value: 3,
    unit: 'days before',
    placeholder: '3',
  },
  {
    key: 'weekly-summary',
    label: 'Weekly spending summary',
    description: 'Receive a weekly digest of your spending',
    enabled: true,
    controlType: 'select',
    value: 'monday',
    selectOptions: DAYS_OF_WEEK,
  },
  {
    key: 'monthly-report',
    label: 'Monthly report ready',
    description: 'Get notified when your monthly financial report is generated',
    enabled: true,
  },
  {
    key: 'low-balance',
    label: 'Low balance warning',
    description: 'Alert when your account balance drops below a threshold',
    enabled: false,
    controlType: 'number',
    value: 500,
    unit: '€',
    placeholder: '500',
  },
  {
    key: 'new-transaction',
    label: 'New transaction notifications',
    description: 'Get notified for every new transaction recorded',
    enabled: false,
  },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preference[]>(DEFAULT_PREFERENCES);

  const togglePreference = (key: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const updateValue = (key: string, value: number | string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value } : p))
    );
  };

  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Icons.settings className='size-5' />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-0 divide-y'>
        {preferences.map((pref) => (
          <div key={pref.key} className='flex items-center justify-between gap-4 py-4'>
            {/* Left: label + description */}
            <div className='flex-1 min-w-0'>
              <Label
                htmlFor={pref.key}
                className='text-sm font-medium cursor-pointer'
              >
                {pref.label}
              </Label>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {pref.description}
              </p>
            </div>

            {/* Right: optional control + toggle */}
            <div className='flex items-center gap-3 shrink-0'>
              {pref.enabled && pref.controlType === 'number' && (
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    value={pref.value as number}
                    onChange={(e) =>
                      updateValue(pref.key, parseFloat(e.target.value) || 0)
                    }
                    className='h-8 w-20 text-sm text-right'
                    min={0}
                  />
                  <span className='text-xs text-muted-foreground whitespace-nowrap'>
                    {pref.unit}
                  </span>
                </div>
              )}

              {pref.enabled && pref.controlType === 'select' && pref.selectOptions && (
                <Select
                  value={pref.value as string}
                  onValueChange={(v) => updateValue(pref.key, v)}
                >
                  <SelectTrigger className='h-8 w-[130px] text-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pref.selectOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Switch
                id={pref.key}
                checked={pref.enabled}
                onCheckedChange={() => togglePreference(pref.key)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
