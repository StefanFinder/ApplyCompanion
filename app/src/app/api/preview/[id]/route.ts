import { NextRequest, NextResponse } from 'next/server';
import { readJob, readResume } from '@/lib/storage';
import { buildHtml } from '@/lib/pdf-generator';

type DocType = 'resume' | 'coverLetter' | 'hiringManagerMessage' | 'whyCompany';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const docType = (searchParams.get('doc') as DocType) || 'resume';

  const job = readJob(params.id);
  if (!job) return new NextResponse('Job not found', { status: 404 });

  const content = job.documents[docType];
  if (!content) return new NextResponse('Document not yet generated', { status: 400 });

  const resume = readResume();
  const meta = {
    name: resume?.personal.name,
    company: job.company,
    title: job.title,
  };

  const html = buildHtml(content, docType, meta);
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
