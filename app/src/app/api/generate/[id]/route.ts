import { NextRequest, NextResponse } from 'next/server';
import { readJob, readResume, writeJob } from '@/lib/storage';
import { generateDocuments } from '@/lib/claude';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const job = readJob(params.id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const resume = readResume();
  if (!resume) {
    return NextResponse.json(
      { error: 'No master resume found. Please set up your resume first.' },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart.' },
      { status: 500 }
    );
  }

  try {
    const documents = await generateDocuments(
      resume,
      job.description,
      job.company,
      job.title
    );

    job.documents = documents;
    job.status = 'generated';
    job.statusTimestamps = { ...job.statusTimestamps, generated: new Date().toISOString() };
    writeJob(job);

    return NextResponse.json({ ok: true, documents });
  } catch (err: unknown) {
    console.error('[POST /api/generate]', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
