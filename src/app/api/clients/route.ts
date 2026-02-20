import { NextRequest, NextResponse } from 'next/server';
import { readClientsData, writeClientsData } from '@/lib/data';
import type { Client, ClientStatus } from '@/lib/types';

export async function GET(): Promise<NextResponse> {
  try {
    const data = await readClientsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await readClientsData();
    const newClient = await request.json() as Client;
    newClient.id = newClient.id || `client-${Date.now()}`;
    data.clients.push(newClient);
    data.lastUpdated = new Date().toISOString();
    await writeClientsData(data);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to add client' }, { status: 500 });
  }
}

interface PatchBody {
  id: string;
  [key: string]: unknown;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PatchBody;
    if (!body.id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const data = await readClientsData();
    const idx = data.clients.findIndex((c) => c.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = { ...data.clients[idx] };
    const allowedFields = ['name', 'businessName', 'contact', 'email', 'phone', 'business',
      'status', 'rate', 'revenueModel', 'paymentType', 'avgMonthly', 'projectValue',
      'monthlyRetainer', 'retainerAmount', 'projectAmount', 'since', 'startDate',
      'lastActivity', 'tags', 'notes', 'link', 'dueDate', 'paymentStatus',
      'invoiceStatus', 'hourlyRate', 'monthlyTotal'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (client as Record<string, unknown>)[field] = body[field];
      }
    }

    data.clients[idx] = client;
    data.lastUpdated = new Date().toISOString();
    await writeClientsData(data);
    return NextResponse.json(client);
  } catch (error) {
    console.error('PATCH /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const data = await readClientsData();
    const idx = data.clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Soft delete — set status to closed
    data.clients[idx] = { ...data.clients[idx], status: 'closed' as ClientStatus };
    data.lastUpdated = new Date().toISOString();
    await writeClientsData(data);
    return NextResponse.json({ success: true, client: data.clients[idx] });
  } catch (error) {
    console.error('DELETE /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
