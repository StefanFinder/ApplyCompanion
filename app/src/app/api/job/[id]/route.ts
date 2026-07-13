import { NextRequest, NextResponse } from 'next/server';
import { readJob, writeJob, deleteJob } from '@/lib/storage';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const job = readJob(params.id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const job = readJob(params.id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates = await req.json();

  // Allow updating: status, documents fields, company, title
  if (updates.status && updates.status !== job.status) {
    job.status = updates.status;
    job.statusTimestamps = {
      ...job.statusTimestamps,
      [updates.status]: new Date().toISOString(),
    };
  }
  if (updates.company !== undefined) job.company = updates.company;
  if (updates.title !== undefined) job.title = updates.title;
  if (updates.notes !== undefined) job.notes = updates.notes;
  if (updates.documents) {
    job.documents = { ...job.documents, ...updates.documents };
  }

  writeJob(job);
  return NextResponse.json(job);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  deleteJob(params.id);
  return NextResponse.json({ ok: true });
}
