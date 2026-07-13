import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/storage';

export async function GET() {
  const jobs = listJobs();
  return NextResponse.json(jobs);
}
