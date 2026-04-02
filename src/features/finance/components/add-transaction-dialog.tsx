'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatEuro, classifyTransaction } from '../utils/format';
import { CategoryBadge } from './category-badge';
import { toast } from 'sonner';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [predictedCategory, setPredictedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-classify transaction as user types
  useEffect(() => {
    if (description) {
      const category = classifyTransaction(description, parseFloat(amount) || 0);
      setPredictedCategory(category);
    } else {
      setPredictedCategory('');
    }
  }, [description, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show success message
      toast.success('Transaction added successfully');

      // Reset form
      setDate('');
      setDescription('');
      setAmount('');
      setType('expense');
      setPredictedCategory('');

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>Add Transaction</SheetTitle>
          <SheetDescription>
            Record a new transaction in your account
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-auto py-4"
        >
          {/* Date Picker */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={handleDateChange}
              required
            />
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g. Mercadona, Netflix..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount (€) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Type Toggle */}
          <div className="flex flex-col gap-2">
            <Label>Type *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setType('expense')}
              >
                <Icons.trendingDown className="mr-2 h-4 w-4" />
                Expense
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setType('income')}
              >
                <Icons.trendingUp className="mr-2 h-4 w-4" />
                Income
              </Button>
            </div>
          </div>

          {/* Category Preview */}
          {predictedCategory && (
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs">
                Auto-classified as:
              </Label>
              <CategoryBadge category={predictedCategory} />
            </div>
          )}

          {/* Amount Preview */}
          {amount && (
            <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                {type === 'income' ? 'You will receive' : 'You will spend'}
              </p>
              <p
                className={`text-lg font-bold ${
                  type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-foreground'
                }`}
              >
                {type === 'income' ? '+' : '-'}{formatEuro(Math.abs(parseFloat(amount) || 0))}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Icons.add className="mr-2 h-4 w-4" />
                  Add Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
