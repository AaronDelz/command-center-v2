'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDynamicSubtitle } from '@/lib/subtitles';
import { RevenueOverview } from '@/components/billing/RevenueOverview';
import { LedgerBillingTable } from '@/components/billing/BillingTable';
import { RevenueChart } from '@/components/billing/RevenueChart';
import { ClientBreakdown } from '@/components/billing/ClientBreakdown';
import { color } from '@/styles/tokens';
import type { BillingPeriod, Client, BillingData, ClientsData } from '@/lib/types';

export default function BillingPage(): React.ReactElement {
  const [allPeriods, setAllPeriods] = useState<BillingPeriod[]>([]);
  const [monthPeriods, setMonthPeriods] = useState<BillingPeriod[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const fetchAll = useCallback(async () => {
    try {
      const [billingAllRes, billingMonthRes, clientsRes] = await Promise.all([
        fetch('/api/billing'),
        fetch(`/api/billing?month=${viewMonth}&year=${viewYear}`),
        fetch('/api/clients'),
      ]);
      if (billingAllRes.ok) {
        const d = await billingAllRes.json() as BillingData;
        setAllPeriods(d.billingPeriods);
      }
      if (billingMonthRes.ok) {
        const d = await billingMonthRes.json() as BillingData;
        setMonthPeriods(d.billingPeriods);
      }
      if (clientsRes.ok) {
        const d = await clientsRes.json() as ClientsData;
        setClients(d.clients);
      }
    } catch (e) {
      console.error('Error fetching billing data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    setIsLoading(true);
    fetchAll();
  }, [fetchAll]);

  const navigate = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
      if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else {
      if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="The Ledger" subtitle={getDynamicSubtitle('billing')} />
        <div style={{ padding: '60px', textAlign: 'center', color: color.text.dim }}>
          Loading billing data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="The Ledger" subtitle={getDynamicSubtitle('billing')} />

      {/* Revenue Overview Cards */}
      <RevenueOverview allPeriods={allPeriods} viewMonth={viewMonth} viewYear={viewYear} />

      {/* Billing Table */}
      <LedgerBillingTable
        periods={monthPeriods}
        clients={clients}
        viewMonth={viewMonth}
        viewYear={viewYear}
        onNavigate={navigate}
        onRefresh={fetchAll}
      />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginTop: '24px' }}>
        <RevenueChart allPeriods={allPeriods} viewMonth={viewMonth} viewYear={viewYear} />
        <ClientBreakdown periods={monthPeriods} clients={clients} />
      </div>
    </div>
  );
}
