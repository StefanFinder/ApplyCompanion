import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Resume } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a resume parser. Extract all information from the provided resume PDF and return it as a single JSON object matching this exact TypeScript interface:

{
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    id: string;          // generate a unique string like "exp-1"
    company: string;
    title: string;
    location?: string;
    startDate: string;   // e.g. "Jan 2022" or "2022"
    endDate: string;     // e.g. "Present" or "Mar 2024"
    bullets: string[];   // each bullet as a plain string, no leading "•" or "-"
  }>;
  education: Array<{
    id: string;          // generate a unique string like "edu-1"
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    notes?: string;
  }>;
  skills: Array<{
    id: string;          // generate a unique string like "skill-1"
    name: string;        // category name e.g. "Languages", "Frameworks", "Tools"
    items: string[];     // individual skills
  }>;
  projects: Array<{
    id: string;          // generate a unique string like "proj-1"
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
}

Rules:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
- If a field is not present in the resume, use an empty string "" or empty array [].
- Group skills into logical categories (Languages, Frameworks, Tools, Cloud, etc.) if not already grouped.
- Each bullet point should be a complete sentence from the resume.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Extract all resume data from this PDF and return the JSON object.',
            },
          ],
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response from Claude');

    // Strip any accidental markdown fences
    const raw = block.text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(raw) as Resume;

    // Ensure all IDs are present (in case Claude omitted them)
    parsed.experience = (parsed.experience || []).map((e, i) => ({ ...e, id: e.id || `exp-${i + 1}` }));
    parsed.education = (parsed.education || []).map((e, i) => ({ ...e, id: e.id || `edu-${i + 1}` }));
    parsed.skills = (parsed.skills || []).map((s, i) => ({ ...s, id: s.id || `skill-${i + 1}` }));
    parsed.projects = (parsed.projects || []).map((p, i) => ({ ...p, id: p.id || `proj-${i + 1}` }));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[POST /api/resume/import]', err);
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
