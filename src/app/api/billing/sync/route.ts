import { NextRequest, NextResponse } from 'next/server';
import { readBillingData, writeBillingData, readTimeEntriesData, readClientsData } from '@/lib/data';

interface SyncResult {
  updated: { client: string; oldTracked: number; newTracked: number }[];
  unchanged: string[];
  month: number;
  year: number;
}

// POST /api/billing/sync — recalculate incomeTracked from time entries for a given month/year
// Also auto-creates billing periods if they don't exist (calls rotate logic inline)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { month?: number; year?: number };

    const now = new Date();
    const month = body.month || now.getMonth() + 1;
    const year = body.year || now.getFullYear();

    if (month < 1 || month > 12 || year < 2020) {
      return NextResponse.json({ error: 'Invalid month/year' }, { status: 400 });
    }

    const [billingData, timeData, clientsData] = await Promise.all([
      readBillingData(),
      readTimeEntriesData(),
      readClientsData(),
    ]);

    // Calculate tracked income from time entries per client for this month
    const trackedByClient = new Map<string, number>();

    for (const entry of timeData.entries) {
      if (!entry.billable || entry.isRunning || !entry.endTime) continue;

      const entryDate = new Date(entry.startTime);
      const entryMonth = entryDate.getMonth() + 1;
      const entryYear = entryDate.getFullYear();

      if (entryMonth !== month || entryYear !== year) continue;

      const minutes = entry.duration ?? 0;
      const hours = minutes / 60;
      const rate = entry.rate ?? 0;
      const value = hours * rate;

      const prev = trackedByClient.get(entry.clientId) ?? 0;
      trackedByClient.set(entry.clientId, prev + value);
    }

    const updated: SyncResult['updated'] = [];
    const unchanged: string[] = [];
    const nowISO = now.toISOString();
    let changed = false;

    // For each client with time entries, find or create the billing period and update
    const allClientIds = new Set([
      ...trackedByClient.keys(),
      ...billingData.billingPeriods
        .filter(p => p.month === month && p.year === year)
        .map(p => p.clientId),
    ]);

    for (const clientId of allClientIds) {
      const newTracked = Math.round((trackedByClient.get(clientId) ?? 0) * 100) / 100;

      let period = billingData.billingPeriods.find(
        p => p.clientId === clientId && p.month === month && p.year === year
      );

      // Auto-create period if it doesn't exist
      if (!period) {
        const client = clientsData.clients.find(c => c.id === clientId);
        period = {
          id: `bp-${clientId.slice(0, 8)}-${year}-${String(month).padStart(2, '0')}`,
          clientId,
          month,
          year,
          period: 'current',
          incomeTracked: 0,
          incomeRetainer: client?.monthlyRetainer ?? 0,
          incomeProject: 0,
          monthlyTotal: client?.monthlyRetainer ?? 0,
          paymentStatus: 'pending',
          invoiceSentDate: null,
          paymentReceivedDate: null,
          notes: '',
          createdAt: nowISO,
        };
        billingData.billingPeriods.push(period);
        changed = true;
      }

      if (Math.abs(period.incomeTracked - newTracked) > 0.01) {
        const clientName = clientsData.clients.find(c => c.id === clientId)?.name ?? clientId;
        updated.push({
          client: clientName,
          oldTracked: period.incomeTracked,
          newTracked,
        });
        period.incomeTracked = newTracked;
        period.monthlyTotal = period.incomeTracked + period.incomeRetainer + period.incomeProject;
        period.updatedAt = nowISO;
        changed = true;
      } else {
        const clientName = clientsData.clients.find(c => c.id === clientId)?.name ?? clientId;
        unchanged.push(clientName);
      }
    }

    if (changed) {
      billingData.lastUpdated = nowISO;
      await writeBillingData(billingData);
    }

    const result: SyncResult = { updated, unchanged, month, year };
    return NextResponse.json(result, { status: updated.length > 0 ? 200 : 200 });
  } catch (error) {
    console.error('POST /api/billing/sync error:', error);
    return NextResponse.json({ error: 'Failed to sync billing' }, { status: 500 });
  }
}
