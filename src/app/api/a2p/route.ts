import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { A2PData, A2PRegistration } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'a2p.json');

function readData(): A2PData {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { registrations: [], lastUpdated: new Date().toISOString() };
  }
}

function writeData(data: A2PData): void {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET — list all registrations
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(readData());
}

// POST — add new registration
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const data = readData();

  const registration: A2PRegistration = {
    id: `a2p-${Date.now()}`,
    businessName: body.businessName || '',
    status: body.status || 'to_submit',
    registrationType: body.registrationType || 'a2p',
    businessType: body.businessType || 'business',
    dateCreated: body.dateCreated || new Date().toISOString().split('T')[0],
    dateSubmitted: body.dateSubmitted || '',
    dateBrandApproved: body.dateBrandApproved || '',
    dateFullyApproved: body.dateFullyApproved || '',
    approvalDays: body.approvalDays ?? null,
    notes: body.notes || '',
    clientId: body.clientId || undefined,
  };

  data.registrations.unshift(registration);
  writeData(data);
  return NextResponse.json(registration, { status: 201 });
}

// PATCH — update registration
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data = readData();
  const idx = data.registrations.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Auto-set dates on status transitions
  const oldStatus = data.registrations[idx].status;
  const newStatus = updates.status;
  if (newStatus && newStatus !== oldStatus) {
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'submitted' && !updates.dateSubmitted) {
      updates.dateSubmitted = today;
    }
    if (newStatus === 'brand_approved' && !updates.dateBrandApproved) {
      updates.dateBrandApproved = today;
    }
    if (newStatus === 'fully_approved' && !updates.dateFullyApproved) {
      updates.dateFullyApproved = today;
      // Calculate approval days
      const submitted = updates.dateSubmitted || data.registrations[idx].dateSubmitted;
      if (submitted) {
        const diff = Math.ceil((new Date(today).getTime() - new Date(submitted).getTime()) / (1000 * 60 * 60 * 24));
        updates.approvalDays = diff;
      }
    }
  }

  data.registrations[idx] = { ...data.registrations[idx], ...updates };
  writeData(data);
  return NextResponse.json(data.registrations[idx]);
}

// DELETE — remove registration
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data = readData();
  data.registrations = data.registrations.filter((r) => r.id !== id);
  writeData(data);
  return NextResponse.json({ ok: true });
}
