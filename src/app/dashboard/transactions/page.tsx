'use client';

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { TransactionsTable } from '@/features/finance/components/transactions-table';
import { AddTransactionDialog } from '@/features/finance/components/add-transaction-dialog';

export default function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer
      pageTitle="Transactions"
      pageDescription="View and manage all your transactions"
      pageHeaderAction={
        <Button onClick={() => setDialogOpen(true)}>
          <Icons.add className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      }
    >
      <TransactionsTable onAddClick={() => setDialogOpen(true)} />

      <AddTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  );
}
