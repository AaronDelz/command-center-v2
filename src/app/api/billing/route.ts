import { NextRequest, NextResponse } from 'next/server';
import { readBillingData, writeBillingData } from '@/lib/data';
import type { BillingPeriod, BillingPaymentStatus } from '@/lib/types';

const PAYMENT_STATUS_ORDER: BillingPaymentStatus[] = ['pending', 'invoiceSent', 'received', 'completed'];

// GET /api/billing — list billing periods (filterable by month/year/clientId)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readBillingData();
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    const clientId = url.searchParams.get('clientId');

    let periods = data.billingPeriods;

    if (month) periods = periods.filter(p => p.month === parseInt(month));
    if (year) periods = periods.filter(p => p.year === parseInt(year));
    if (clientId) periods = periods.filter(p => p.clientId === clientId);

    return NextResponse.json({ billingPeriods: periods, lastUpdated: data.lastUpdated });
  } catch (error) {
    console.error('GET /api/billing error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }
}

// POST /api/billing — create billing period
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readBillingData();
    const body = await request.json() as Partial<BillingPeriod>;

    if (!body.clientId || !body.month || !body.year) {
      return NextResponse.json({ error: 'clientId, month, and year are required' }, { status: 400 });
    }

    // Check for duplicate
    const exists = data.billingPeriods.find(
      p => p.clientId === body.clientId && p.month === body.month && p.year === body.year
    );
    if (exists) {
      return NextResponse.json({ error: 'Billing period already exists for this client/month/year' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newPeriod: BillingPeriod = {
      id: `bp-${Date.now()}`,
      clientId: body.clientId,
      month: body.month,
      year: body.year,
      period: body.period || 'current',
      incomeTracked: body.incomeTracked || 0,
      incomeRetainer: body.incomeRetainer || 0,
      incomeProject: body.incomeProject || 0,
      monthlyTotal: (body.incomeTracked || 0) + (body.incomeRetainer || 0) + (body.incomeProject || 0),
      paymentStatus: body.paymentStatus || 'pending',
      invoiceSentDate: null,
      paymentReceivedDate: null,
      notes: body.notes || '',
      createdAt: now,
    };

    data.billingPeriods.push(newPeriod);
    data.lastUpdated = now;
    await writeBillingData(data);

    return NextResponse.json(newPeriod, { status: 201 });
  } catch (error) {
    console.error('POST /api/billing error:', error);
    return NextResponse.json({ error: 'Failed to create billing period' }, { status: 500 });
  }
}

// PATCH /api/billing — update billing period
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { id: string; [key: string]: unknown };

    if (!body.id) {
      return NextResponse.json({ error: 'Billing period ID is required' }, { status: 400 });
    }

    const data = await readBillingData();
    const idx = data.billingPeriods.findIndex(p => p.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Billing period not found' }, { status: 404 });
    }

    const period = { ...data.billingPeriods[idx] };
    const now = new Date().toISOString();

    // Handle payment status advancement
    if (body.advanceStatus === true) {
      const currentIdx = PAYMENT_STATUS_ORDER.indexOf(period.paymentStatus);
      if (currentIdx < PAYMENT_STATUS_ORDER.length - 1) {
        const newStatus = PAYMENT_STATUS_ORDER[currentIdx + 1];
        period.paymentStatus = newStatus;

        // Auto-set dates
        if (newStatus === 'invoiceSent' && !period.invoiceSentDate) {
          period.invoiceSentDate = now;
        }
        if (newStatus === 'received' && !period.paymentReceivedDate) {
          period.paymentReceivedDate = now;
        }
      }
    } else if (body.paymentStatus && typeof body.paymentStatus === 'string') {
      const newStatus = body.paymentStatus as BillingPaymentStatus;
      period.paymentStatus = newStatus;
      if (newStatus === 'invoiceSent' && !period.invoiceSentDate) {
        period.invoiceSentDate = now;
      }
      if (newStatus === 'received' && !period.paymentReceivedDate) {
        period.paymentReceivedDate = now;
      }
    }

    // Update other fields
    const allowedFields = ['incomeTracked', 'incomeRetainer', 'incomeProject', 'notes', 'period'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (period as Record<string, unknown>)[field] = body[field];
      }
    }

    // Recalculate monthly total
    period.monthlyTotal = period.incomeTracked + period.incomeRetainer + period.incomeProject;
    period.updatedAt = now;

    data.billingPeriods[idx] = period;
    data.lastUpdated = now;
    await writeBillingData(data);

    return NextResponse.json(period);
  } catch (error) {
    console.error('PATCH /api/billing error:', error);
    return NextResponse.json({ error: 'Failed to update billing period' }, { status: 500 });
  }
}
