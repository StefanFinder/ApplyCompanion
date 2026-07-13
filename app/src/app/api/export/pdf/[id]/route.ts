import { NextRequest, NextResponse } from 'next/server';
import { readJob, readResume } from '@/lib/storage';
import { generatePdf } from '@/lib/pdf-generator';

type DocType = 'resume' | 'coverLetter' | 'hiringManagerMessage' | 'whyCompany';

const FILE_NAMES: Record<DocType, string> = {
  resume: 'Resume',
  coverLetter: 'Cover-Letter',
  hiringManagerMessage: 'HM-Message',
  whyCompany: 'Why-This-Company',
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const docType = (searchParams.get('doc') as DocType) || 'resume';

  const job = readJob(params.id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const content = job.documents[docType];
  if (!content) {
    return NextResponse.json(
      { error: `Document "${docType}" has not been generated yet.` },
      { status: 400 }
    );
  }

  const resume = readResume();
  const meta = {
    name: resume?.personal.name,
    company: job.company,
    title: job.title,
  };

  try {
    const buffer = await generatePdf(content, docType, meta);
    const slug = FILE_NAMES[docType];
    const company = job.company ? `_${job.company.replace(/\s+/g, '-')}` : '';
    const filename = `${slug}${company}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/export/pdf]', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
