import Anthropic from '@anthropic-ai/sdk';
import type { Resume, JobDocuments } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function resumeToText(resume: Resume): string {
  const { personal, summary, experience, education, skills, projects } = resume;

  const lines: string[] = [];

  lines.push(`NAME: ${personal.name}`);
  lines.push(`CONTACT: ${personal.email} | ${personal.phone} | ${personal.location}`);
  if (personal.linkedin) lines.push(`LinkedIn: ${personal.linkedin}`);
  if (personal.github) lines.push(`GitHub: ${personal.github}`);
  if (personal.website) lines.push(`Website: ${personal.website}`);

  if (summary) {
    lines.push('', 'SUMMARY', summary);
  }

  if (experience.length > 0) {
    lines.push('', 'EXPERIENCE');
    for (const exp of experience) {
      lines.push(`${exp.title} at ${exp.company}${exp.location ? ', ' + exp.location : ''} (${exp.startDate} – ${exp.endDate})`);
      for (const bullet of exp.bullets) {
        lines.push(`  • ${bullet}`);
      }
    }
  }

  if (education.length > 0) {
    lines.push('', 'EDUCATION');
    for (const edu of education) {
      lines.push(`${edu.degree}${edu.field ? ' in ' + edu.field : ''} — ${edu.institution} (${edu.startDate} – ${edu.endDate})${edu.gpa ? ', GPA: ' + edu.gpa : ''}`);
      if (edu.notes) lines.push(`  ${edu.notes}`);
    }
  }

  if (skills.length > 0) {
    lines.push('', 'SKILLS');
    for (const cat of skills) {
      lines.push(`${cat.name}: ${cat.items.join(', ')}`);
    }
  }

  if (projects && projects.length > 0) {
    lines.push('', 'PROJECTS');
    for (const proj of projects) {
      lines.push(`${proj.name}: ${proj.description}`);
      if (proj.technologies.length > 0) {
        lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}

async function ask(systemPrompt: string, userPrompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text.trim();
}

function isCaliforniaJob(jobDescription: string, company: string): boolean {
  const text = `${jobDescription} ${company}`.toLowerCase();
  return /\bcalifornia\b/.test(text) || /\b[a-z\s]+,\s*ca\b/.test(text);
}

export async function generateDocuments(
  resume: Resume,
  jobDescription: string,
  company: string,
  jobTitle: string
): Promise<JobDocuments> {
  const effectiveResume = isCaliforniaJob(jobDescription, company)
    ? { ...resume, personal: { ...resume.personal, location: 'Santa Clara, CA 95051' } }
    : resume;
  const resumeText = resumeToText(effectiveResume);

  const context = `
MASTER RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

COMPANY: ${company || 'the company'}
ROLE: ${jobTitle || 'the role'}
`.trim();

  const [tailoredResume, coverLetter, hiringManagerMessage, whyCompany] = await Promise.all([
    // Tailored resume
    ask(
      `You are an expert resume writer. Produce a tailored ONE-PAGE resume using EXACTLY the format below — no deviations.

━━━ FORMAT SPEC ━━━

Use these inline markers:
  **text**   = bold (company names, institution names, keywords in bullets)
  __text__   = italic (job title line, date on job title line)
  |||        = column separator — left content ||| right-aligned content

SECTION ORDER (must follow this order exactly):
  1. SUMMARY
  2. EDUCATION
  3. SKILLS
  4. PROFESSIONAL EXPERIENCE
  5. PROJECTS

━━━ EXACT TEMPLATE ━━━

[Full Name]
[City, State ZIP | email | phone | linkedin]

SUMMARY
[2 sentences, no indent, no bullet]

EDUCATION
• **[Institution Name]**, [City, State, Country] ||| [Mon'YY-Mon'YY]
  [Degree Level], [Field of Study]
• **[Institution Name]**, [City, State, Country] ||| [Mon'YY-Mon'YY]
  [Degree Level], [Field of Study]

SKILLS
• **[Category]**: [skill1], [skill2], [skill3]
• **[Category]**: [skill1], [skill2], [skill3]

PROFESSIONAL EXPERIENCE
• **[Company Name]** ||| [City, State, Country]
  __Full-time: [Job Title]__ ||| __[Mon'YY-present or Mon'YY-Mon'YY]__
  ♦ Bullet with **bold keywords** for key technologies/actions (≤ 20 words)
  ♦ Bullet with **bold keywords** (≤ 20 words)

• **[Company Name]** ||| [City, State, Country]
  __Full-time: [Job Title]__ ||| __[Mon'YY-Mon'YY]__
  ♦ Bullet (≤ 20 words)

PROJECTS
• **[Project Name]**, [one-line description]
  ♦ Bullet with **bold keywords** (≤ 20 words)
  ♦ Bullet with **bold keywords** (≤ 20 words)

━━━ ONE-PAGE RULES ━━━
- SUMMARY: 2–3 sentences, ≤ 50 words total
- EXPERIENCE: copy bullets from the master resume AS-IS — preserve the original wording, length, and detail exactly; you may only add or bold a keyword from the job description if it fits naturally; NEVER shorten, summarize, or merge bullets; only drop a bullet if it has zero relevance to this specific job; include all bullets from relevant roles
- SECURAM EXCEPTION: for the SECURAM experience only, you MAY substitute technology names to match the job description (e.g. replace "Golang" with "TypeScript" or "JavaScript" if the JD requires those languages); keep the rest of the bullet wording unchanged; only substitute if the candidate plausibly used that technology in the same context (same type of work — backend services, APIs, scripting, etc.); never substitute a technology that is fundamentally different in nature (e.g. do not replace a database with a language)
- SKILLS: tailor the skills section to the job description using these rules:
  1. Keep ALL skill categories from the master resume — do not drop any category
  2. Reorder categories so the most relevant ones to the JD appear first
  3. Within each category, reorder skills so JD-matching skills appear first
  4. You may remove individual skills from a category only if they are completely unrelated to the JD AND removing them makes room for a JD-required skill the candidate demonstrably has (evidenced in their experience or projects)
  5. You may add a skill to an existing category if: it appears in the JD requirements/qualifications AND there is clear evidence the candidate has used it (mentioned in experience or project bullets) — never add skills not found anywhere in the master resume
  6. Never fabricate a skill category or skill not grounded in the master resume
- PROJECTS: include all projects; copy bullets AS-IS from the master resume; do not shorten or merge them
- Total word count: 500–620 words (one dense page)
- FILL REMAINING SPACE: after copying all master resume bullets, if the total word count is below 500 words, add extra ♦ bullets to the most relevant PROFESSIONAL EXPERIENCE role(s) to fill the page; these extra bullets must describe work that is plausible and consistent with the candidate's actual role and company context (same team, same codebase, same type of work) AND directly relevant to the job description; do not invent new projects, employers, or technologies the candidate has not used; keep each extra bullet ≤ 20 words and bold key technologies
- Output ONLY the resume text — no preamble, no commentary, no code fences
- Use ONLY information from the master resume — never fabricate`,
      `${context}

Write the tailored one-page resume now, following the format spec exactly.`
    ),

    // Cover letter
    ask(
      `You are an expert career coach and cover letter writer.
Your task is to write a compelling, concise cover letter (under 300 words, 3-4 paragraphs).
Rules:
- Open with a strong hook showing genuine interest in this specific company and role.
- Highlight 2-3 specific achievements from the resume that directly map to the job requirements.
- Show you've read the job description — reference specific skills or responsibilities.
- Close with a confident call to action.
- Sound like a real, thoughtful person — not a template.`,
      `${context}

Write a cover letter. Address it "Dear Hiring Manager," and format it as a proper letter.`
    ),

    // Hiring manager message
    ask(
      `You are an expert at writing concise, effective cold outreach messages for job seekers.
Write a LinkedIn message or short email to the hiring manager. It must be:
- Under 100 words (3-4 sentences max)
- Personal and specific — reference the exact role and one standout achievement
- End with a low-friction ask (e.g., "Would you have 15 minutes to connect?")
- Professional but human — not stiff or generic`,
      `${context}

Write a brief hiring manager message. Output just the message text, no subject line or preamble.`
    ),

    // Why this company
    ask(
      `You are a career coach helping candidates answer "Why do you want to work at [Company]?" authentically.
The candidate is a natural storyteller — they connect through personal narrative, not just skills and tasks.
Write a genuine, story-driven 3 paragraph response (150–220 words) structured like this:

Paragraph 1 — Personal story hook: open with a specific moment, realization, or experience from the candidate's background (drawn from their resume — e.g. a project they built, a problem they solved, something they discovered working at a past role) that connects emotionally to what this company does or the problem it solves. Make it feel like a real memory, not a resume line.

Paragraph 2 — Connection to the company: bridge that story to this specific company's mission, product, or focus (inferred from the job description). Show you understand what they're building and why it matters. Be specific — no generic "industry leader" language.

Paragraph 3 — Forward-looking fit: explain how joining this team is the natural next chapter of that story. Tie in 1–2 relevant technical strengths from the resume that map to the JD. Close with genuine enthusiasm, not flattery.

Rules:
- Sound like a real person reflecting, not a cover letter
- Never use: "passionate", "excited opportunity", "leverage", "robust", "cutting-edge"
- Draw the personal story only from what's in the resume — never fabricate
- Keep it warm, direct, and human`,
      `${context}

Write a "Why this company?" response. Output just the response text.`
    ),
  ]);

  return {
    resume: tailoredResume,
    coverLetter,
    hiringManagerMessage,
    whyCompany,
  };
}
