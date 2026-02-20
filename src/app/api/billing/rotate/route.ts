import { NextRequest, NextResponse } from 'next/server';
import { readBillingData, writeBillingData, readClientsData } from '@/lib/data';
import type { BillingPeriod } from '@/lib/types';

interface RotateRequest {
  month: number;
  year: number;
}

interface RotateResult {
  created: string[];
  skipped: string[];
  month: number;
  year: number;
}

// POST /api/billing/rotate — idempotent: create billing periods for active clients
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as RotateRequest;
    const { month, year } = body;

    if (!month || !year || month < 1 || month > 12 || year < 2020) {
      return NextResponse.json(
        { error: 'Valid month (1-12) and year (>= 2020) are required' },
        { status: 400 }
      );
    }

    const [billingData, clientsData] = await Promise.all([
      readBillingData(),
      readClientsData(),
    ]);

    const activeClients = clientsData.clients.filter(
      c => c.status === 'active' || c.status === 'pipeline'
    );

    const existingPeriodKeys = new Set(
      billingData.billingPeriods.map(p => `${p.clientId}-${p.month}-${p.year}`)
    );

    const now = new Date().toISOString();
    const created: string[] = [];
    const skipped: string[] = [];

    for (const client of activeClients) {
      const key = `${client.id}-${month}-${year}`;

      if (existingPeriodKeys.has(key)) {
        skipped.push(client.name);
        continue;
      }

      const newPeriod: BillingPeriod = {
        id: `bp-${client.id.slice(0, 8)}-${year}-${String(month).padStart(2, '0')}`,
        clientId: client.id,
        month,
        year,
        period: 'current',
        incomeTracked: 0,
        incomeRetainer: client.monthlyRetainer ?? 0,
        incomeProject: 0,
        monthlyTotal: client.monthlyRetainer ?? 0,
        paymentStatus: 'pending',
        invoiceSentDate: null,
        paymentReceivedDate: null,
        notes: '',
        createdAt: now,
      };

      billingData.billingPeriods.push(newPeriod);
      created.push(client.name);
    }

    if (created.length > 0) {
      billingData.lastUpdated = now;
      await writeBillingData(billingData);
    }

    const result: RotateResult = { created, skipped, month, year };
    return NextResponse.json(result, { status: created.length > 0 ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/billing/rotate error:', error);
    return NextResponse.json({ error: 'Failed to rotate billing periods' }, { status: 500 });
  }
}
