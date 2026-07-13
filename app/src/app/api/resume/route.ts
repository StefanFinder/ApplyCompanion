import { NextRequest, NextResponse } from 'next/server';
import { readResume, writeResume } from '@/lib/storage';
import type { Resume } from '@/lib/types';

export async function GET() {
  const resume = readResume();
  return NextResponse.json(resume ?? null);
}

export async function PUT(req: NextRequest) {
  try {
    const body: Resume = await req.json();
    writeResume(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/resume]', err);
    return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 });
  }
}
