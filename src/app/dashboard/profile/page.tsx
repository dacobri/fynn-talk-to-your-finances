'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { useUserPreferences } from '@/features/finance/utils/user-preferences-store';
import { fetchAccounts, uploadCSV } from '@/features/finance/utils/api';
import { toast } from 'sonner';

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

function AddAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'options' | 'upload'>('options');
  const [bankName, setBankName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Please drop a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!bankName.trim() || !file) {
      toast.error('Please enter a bank name and select a file');
      return;
    }

    setIsLoading(true);
    try {
      await uploadCSV(bankName, file);
      toast.success(`${bankName} account added successfully`);
      setIsOpen(false);
      setStep('options');
      setBankName('');
      setFile(null);
    } catch (error) {
      toast.error('Failed to upload CSV');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep('options');
      setBankName('');
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {step === 'options' ? 'Add Bank Account' : `Upload CSV for ${bankName}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'options' ? (
          <div className='space-y-4'>
            <div
              className='rounded-lg border border-gray-300 bg-gray-50 p-4 cursor-not-allowed opacity-60'
            >
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1'>
                  <span className='text-sm font-medium text-gray-600'>
                    Connect a bank account
                  </span>
                  <span className='text-xs text-gray-500'>
                    Direct bank connection coming soon
                  </span>
                </div>
              </div>
              <div className='mt-3'>
                <Badge variant='secondary' className='text-xs'>
                  Coming soon
                </Badge>
              </div>
            </div>

            <button
              onClick={() => setStep('upload')}
              className='w-full rounded-lg border border-blue-300 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100'
            >
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1'>
                  <span className='text-sm font-medium text-blue-900'>Upload a CSV</span>
                  <span className='text-xs text-blue-700'>
                    Import transactions from a CSV file
                  </span>
                </div>
              </div>
              <div className='mt-3'>
                <Badge className='bg-blue-500 text-white text-xs'>Available</Badge>
              </div>
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Bank Name</label>
              <Input
                placeholder='e.g., Revolut, Wise, BBVA'
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isLoading}
                className='mt-2'
              />
            </div>

            <div>
              <label className='text-sm font-medium'>CSV File</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`mt-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                } ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-400'}`}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.csv'
                  onChange={handleFileSelect}
                  disabled={isLoading}
                  className='hidden'
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className='w-full disabled:cursor-not-allowed'
                >
                  {file ? (
                    <div className='flex flex-col items-center gap-1'>
                      <Icons.check className='size-5 text-green-500' />
                      <span className='text-sm font-medium text-gray-900'>{file.name}</span>
                      <span className='text-xs text-gray-500'>
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center gap-2'>
                      <Icons.upload className='size-5 text-gray-400' />
                      <span className='text-sm font-medium text-gray-900'>
                        Drag and drop your CSV file
                      </span>
                      <span className='text-xs text-gray-500'>or click to select</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className='flex gap-3 pt-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setStep('options');
                  setBankName('');
                  setFile(null);
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!bankName.trim() || !file || isLoading}
                className='flex-1'
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const prefs = useUserPreferences();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);
      setAccountsError(null);
      const data = await fetchAccounts();
      setAccounts(data.accounts ?? data);
    } catch (error) {
      setAccountsError('Failed to load accounts');
      console.error(error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleAddAccountSuccess = () => {
    loadAccounts();
  };

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
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <Icons.creditCard className='size-5' />
                  Connected Bank Accounts
                </CardTitle>
                <CardDescription>
                  Accounts linked to your Fynn profile for transaction tracking
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {accountsLoading ? (
              <div className='flex items-center justify-center py-8'>
                <span className='text-sm text-muted-foreground'>Loading accounts...</span>
              </div>
            ) : accountsError ? (
              <div className='flex items-center justify-center py-8'>
                <span className='text-sm text-red-500'>{accountsError}</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <span className='text-sm text-muted-foreground'>No accounts connected yet</span>
              </div>
            ) : (
              accounts.map((account, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    account.status === 'Connected' ? '' : 'border-dashed'
                  }`}
                >
                  <div className='flex flex-col gap-1'>
                    <span className='text-sm font-medium'>{account.name}</span>
                    {account.transactionCount > 0 && (
                      <span className='text-xs text-muted-foreground'>
                        {account.transactionCount} transactions synced
                      </span>
                    )}
                    {account.firstTransaction && (
                      <span className='text-xs text-muted-foreground'>
                        First: {account.firstTransaction} · Last: {account.lastTransaction}
                      </span>
                    )}
                  </div>
                  <Badge
                    className={
                      account.status === 'Connected'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }
                  >
                    {account.status}
                  </Badge>
                </div>
              ))
            )}

            <div className='flex justify-center pt-4'>
              <AddAccountDialog />
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
