import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { writeJob } from '@/lib/storage';
import type { Job } from '@/lib/types';

// CORS headers so the Chrome extension can call this from the browser context
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company = '', title = '', description = '', url = '' } = body;

    if (!description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400, headers: CORS });
    }

    const now = new Date().toISOString();
    const job: Job = {
      id: uuidv4(),
      company: company.trim(),
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      createdAt: now,
      status: 'pending',
      statusTimestamps: { pending: now },
      notes: '',
      documents: {},
    };

    writeJob(job);

    return NextResponse.json({ id: job.id }, { status: 201, headers: CORS });
  } catch (err) {
    console.error('[POST /api/job]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS });
  }
}
