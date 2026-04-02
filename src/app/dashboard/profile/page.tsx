'use client';

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useUserPreferences } from '@/features/finance/utils/user-preferences-store';

function EditableRow({
  label,
  value,
  field,
  type = 'text',
  editing,
  onSave,
}: {
  label: string;
  value: string;
  field: string;
  type?: string;
  editing: boolean;
  onSave: (field: string, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <div className='flex items-center justify-between py-3'>
        <span className='text-sm text-muted-foreground'>{label}</span>
        <span className='text-sm font-medium'>{value}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-between gap-4 py-3'>
      <span className='text-sm text-muted-foreground whitespace-nowrap'>{label}</span>
      <Input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onSave(field, localValue)}
        className='h-8 max-w-[260px] text-sm'
      />
    </div>
  );
}

export default function ProfilePage() {
  const prefs = useUserPreferences();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

  const handleSave = (field: string, value: string) => {
    if (field === 'monthlyBudget' || field === 'alertThreshold') {
      prefs.setPreference(field as any, parseFloat(value) || 0);
    } else {
      prefs.setPreference(field as any, value);
    }
  };

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-3xl flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Profile</h2>
          <p className='text-muted-foreground'>Your personal and financial account details</p>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Icons.user className='size-5' />
                Personal Information
              </CardTitle>
              <Button
                variant={editingPersonal ? 'default' : 'outline'}
                size='sm'
                onClick={() => setEditingPersonal(!editingPersonal)}
              >
                {editingPersonal ? 'Done' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-0 divide-y'>
            <EditableRow label='Full Name' value={prefs.firstName} field='firstName' editing={editingPersonal} onSave={handleSave} />
            <EditableRow label='Email' value={prefs.email} field='email' type='email' editing={editingPersonal} onSave={handleSave} />
            <EditableRow label='Phone' value={prefs.phone} field='phone' type='tel' editing={editingPersonal} onSave={handleSave} />
            <EditableRow label='Location' value={prefs.location} field='location' editing={editingPersonal} onSave={handleSave} />
            {editingPersonal ? (
              <div className='flex items-center justify-between gap-4 py-3'>
                <span className='text-sm text-muted-foreground whitespace-nowrap'>Language</span>
                <Select value={prefs.language} onValueChange={(v) => prefs.setPreference('language', v)}>
                  <SelectTrigger className='h-8 max-w-[260px] text-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='English'>English</SelectItem>
                    <SelectItem value='Spanish'>Spanish</SelectItem>
                    <SelectItem value='Italian'>Italian</SelectItem>
                    <SelectItem value='Catalan'>Catalan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className='flex items-center justify-between py-3'>
                <span className='text-sm text-muted-foreground'>Language</span>
                <span className='text-sm font-medium'>{prefs.language}</span>
              </div>
            )}
            <div className='flex items-center justify-between py-3'>
              <span className='text-sm text-muted-foreground'>Currency</span>
              <span className='text-sm font-medium'>{prefs.currency}</span>
            </div>
          </CardContent>
        </Card>

        {/* Connected Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.creditCard className='size-5' />
              Connected Bank Accounts
            </CardTitle>
            <CardDescription>
              Accounts linked to your Fynn profile for transaction tracking
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-medium'>CaixaBank — Checking Account</span>
                <span className='text-xs text-muted-foreground'>ES91 2100 •••• •••• •••• 4823</span>
                <span className='text-xs text-muted-foreground'>Primary account · 3,494 transactions synced</span>
              </div>
              <Badge className='bg-green-500/10 text-green-500'>Connected</Badge>
            </div>
            <div className='flex items-center justify-between rounded-lg border border-dashed p-4'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-medium'>CaixaBank — Savings Account</span>
                <span className='text-xs text-muted-foreground'>ES91 2100 •••• •••• •••• 7291</span>
                <span className='text-xs text-muted-foreground'>Not yet synced</span>
              </div>
              <Badge variant='outline'>Pending</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Icons.settings className='size-5' />
                Preferences
              </CardTitle>
              <Button
                variant={editingPrefs ? 'default' : 'outline'}
                size='sm'
                onClick={() => setEditingPrefs(!editingPrefs)}
              >
                {editingPrefs ? 'Done' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-0 divide-y'>
            <EditableRow
              label='Monthly Budget'
              value={editingPrefs ? String(prefs.monthlyBudget) : `€${prefs.monthlyBudget.toLocaleString()}`}
              field='monthlyBudget'
              type='number'
              editing={editingPrefs}
              onSave={handleSave}
            />
            <EditableRow
              label='Spending Alert Threshold'
              value={editingPrefs ? String(prefs.alertThreshold) : `When exceeding ${prefs.alertThreshold}% of budget`}
              field='alertThreshold'
              type='number'
              editing={editingPrefs}
              onSave={handleSave}
            />
            <div className='flex items-center justify-between py-3'>
              <span className='text-sm text-muted-foreground'>Transaction Notifications</span>
              <span className='text-sm font-medium'>Enabled</span>
            </div>
            <div className='flex items-center justify-between py-3'>
              <span className='text-sm text-muted-foreground'>AI Assistant Language</span>
              <span className='text-sm font-medium'>{prefs.language}</span>
            </div>
            <div className='flex items-center justify-between py-3'>
              <span className='text-sm text-muted-foreground'>Data Retention</span>
              <span className='text-sm font-medium'>5 years</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
