type DocType = 'resume' | 'coverLetter' | 'hiringManagerMessage' | 'whyCompany';

const LETTER_TITLE: Record<Exclude<DocType, 'resume'>, string> = {
  coverLetter: 'Cover Letter',
  hiringManagerMessage: 'Hiring Manager Message',
  whyCompany: 'Why This Company',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Parse **bold** and __italic__ markers into HTML spans.
// Must be called AFTER escaping HTML so we don't double-escape.
function parseInline(raw: string): string {
  const escaped = escapeHtml(raw);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<em>$1</em>');
}

// ─── Resume renderer ──────────────────────────────────────────────────────────
//
// Expected Claude output format:
//
//   [Full Name]                                            ← line 1: name
//   [City, ZIP | email | phone | linkedin]                 ← line 2: contact
//
//   SUMMARY
//   [paragraph text]
//
//   EDUCATION
//   • **Institution**, Location ||| Mon'YY-Mon'YY
//     Degree Level, Field
//
//   SKILLS
//   • **Category**: item1, item2
//
//   PROFESSIONAL EXPERIENCE
//   • **Company** ||| City, State
//     __Full-time: Title__ ||| __Mon'YY-Mon'YY__
//     ♦ bullet with **bold** keywords
//
//   PROJECTS
//   • **Project Name**, description
//     ♦ bullet with **bold** keywords

function buildResumeHtml(content: string): string {
  const lines = content.split('\n');

  // Find name (first non-empty) and contact (second non-empty)
  const nonEmptyIdxs: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) nonEmptyIdxs.push(i);
  }
  const nameIdx    = nonEmptyIdxs[0] ?? -1;
  const contactIdx = nonEmptyIdxs[1] ?? -1;
  const nameLine    = nameIdx    >= 0 ? lines[nameIdx].trim()    : '';
  const contactLine = contactIdx >= 0 ? lines[contactIdx].trim() : '';
  const bodyLines   = lines.slice(Math.max(nameIdx, contactIdx) + 1);

  const body: string[] = [];

  for (const line of bodyLines) {
    const trimmed = line.trim();
    const isIndented = line.startsWith('  ') || line.startsWith('\t');

    if (!trimmed) {
      body.push('<div class="gap"></div>');
      continue;
    }

    // ── ALL-CAPS section header ──────────────────────────────────────────────
    const isAllCaps =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      trimmed.length < 60 &&
      !trimmed.startsWith('•') &&
      !trimmed.startsWith('♦') &&
      !/\d{4}/.test(trimmed);

    if (isAllCaps) {
      body.push(`<div class="section-header">${escapeHtml(trimmed)}</div>`);
      continue;
    }

    // ── ♦ sub-bullet (experience / project bullets) ──────────────────────────
    if (trimmed.startsWith('♦')) {
      const text = trimmed.replace(/^♦\s*/, '');
      body.push(
        `<div class="sub-bullet">` +
        `<span class="sub-marker">♦</span>` +
        `<span>${parseInline(text)}</span>` +
        `</div>`
      );
      continue;
    }

    // ── • bullet with ||| two-column ─────────────────────────────────────────
    if (trimmed.startsWith('•') && trimmed.includes(' ||| ')) {
      const withoutBullet = trimmed.replace(/^•\s*/, '');
      const sepIdx = withoutBullet.indexOf(' ||| ');
      const left  = withoutBullet.slice(0, sepIdx);
      const right = withoutBullet.slice(sepIdx + 5);
      body.push(
        `<div class="bullet-two-col">` +
        `<span class="main-bullet-marker">•</span>` +
        `<span class="two-col-left">${parseInline(left)}</span>` +
        `<span class="two-col-right">${parseInline(right)}</span>` +
        `</div>`
      );
      continue;
    }

    // ── • bullet plain ────────────────────────────────────────────────────────
    if (trimmed.startsWith('•')) {
      const text = trimmed.replace(/^•\s*/, '');
      body.push(
        `<div class="bullet-plain">` +
        `<span class="main-bullet-marker">•</span>` +
        `<span>${parseInline(text)}</span>` +
        `</div>`
      );
      continue;
    }

    // ── Indented detail row with ||| two-column (job title + date) ───────────
    if (isIndented && trimmed.includes(' ||| ')) {
      const sepIdx = trimmed.indexOf(' ||| ');
      const left  = trimmed.slice(0, sepIdx);
      const right = trimmed.slice(sepIdx + 5);
      body.push(
        `<div class="detail-two-col">` +
        `<span>${parseInline(left)}</span>` +
        `<span class="two-col-right">${parseInline(right)}</span>` +
        `</div>`
      );
      continue;
    }

    // ── Indented continuation line (degree name under institution) ───────────
    if (isIndented) {
      body.push(`<div class="indent-line">${parseInline(trimmed)}</div>`);
      continue;
    }

    // ── Plain paragraph (summary text) ───────────────────────────────────────
    body.push(`<div class="para">${parseInline(trimmed)}</div>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${escapeHtml(nameLine)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 8.5in;
    font-family: 'Times New Roman', Times, serif;
    font-size: 10.5pt;
    line-height: 1.18;
    color: #000;
    background: #fff;
  }

  .page {
    padding: 0.45in 0.65in;
  }

  /* ── Header ── */
  .resume-name {
    text-align: center;
    font-size: 17pt;
    font-weight: bold;
    margin-bottom: 1pt;
  }

  .resume-contact {
    text-align: center;
    font-size: 9.5pt;
    margin-bottom: 3pt;
  }

  /* ── Section headers ── */
  .section-header {
    font-size: 11pt;
    font-weight: bold;
    border-bottom: 1pt solid #000;
    padding-bottom: 0pt;
    margin-top: 5pt;
    margin-bottom: 2pt;
  }

  .gap { height: 0pt; }

  /* ── Bullets ── */
  .bullet-two-col,
  .bullet-plain {
    display: flex;
    align-items: baseline;
    gap: 3pt;
    margin-bottom: 0pt;
  }

  .main-bullet-marker {
    flex-shrink: 0;
    width: 9pt;
  }

  .two-col-left  { flex: 1; }

  .two-col-right {
    flex-shrink: 0;
    text-align: right;
    padding-left: 6pt;
  }

  /* ── Indented detail row (job title + date) ── */
  .detail-two-col {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-left: 12pt;
    margin-bottom: 0pt;
  }

  /* ── Continuation line (degree name) ── */
  .indent-line {
    padding-left: 12pt;
    margin-bottom: 0pt;
  }

  /* ── ♦ sub-bullet ── */
  .sub-bullet {
    display: flex;
    align-items: baseline;
    gap: 3pt;
    padding-left: 20pt;
    margin-bottom: 0pt;
  }

  .sub-marker {
    flex-shrink: 0;
    font-size: 6.5pt;
    padding-top: 1pt;
  }

  /* ── Summary paragraph ── */
  .para {
    margin-bottom: 1pt;
  }

  @page { size: Letter; margin: 0; }
</style>
</head>
<body>
<div class="page">
  <div class="resume-name">${escapeHtml(nameLine)}</div>
  <div class="resume-contact">${parseInline(contactLine)}</div>
  ${body.join('\n  ')}
</div>
</body>
</html>`;
}

// ─── Letter/doc renderer (cover letter, HM message, why company) ─────────────

function buildLetterHtml(
  content: string,
  docType: Exclude<DocType, 'resume'>,
  meta: { name?: string; company?: string; title?: string }
): string {
  const titleText = LETTER_TITLE[docType];
  const subtitle  = [meta.title, meta.company].filter(Boolean).join(' — ');

  const bodyHtml = content.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '<div style="height:8pt"></div>';
    if (t.startsWith('•') || t.startsWith('-')) {
      return `<p class="bullet">• ${parseInline(t.replace(/^[•\-]\s*/, ''))}</p>`;
    }
    return `<p class="line">${parseInline(t)}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${escapeHtml(titleText)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1e293b;
    background: #fff;
    padding: 0.75in 1in;
  }
  .doc-title    { font-size: 20pt; font-weight: 700; color: #6366f1; margin-bottom: 4pt; }
  .doc-subtitle { font-size: 10pt; color: #64748b; font-style: italic; margin-bottom: 24pt; }
  .line   { margin-bottom: 6pt; }
  .bullet { margin-left: 16pt; margin-bottom: 4pt; }
</style>
</head>
<body>
  <div class="doc-title">${escapeHtml(titleText)}</div>
  ${subtitle
    ? `<div class="doc-subtitle">${escapeHtml(subtitle)}</div>`
    : '<div style="margin-bottom:20pt"></div>'}
  ${bodyHtml}
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildHtml(
  content: string,
  docType: DocType,
  meta: { name?: string; company?: string; title?: string }
): string {
  if (docType === 'resume') return buildResumeHtml(content);
  return buildLetterHtml(content, docType, meta);
}

export async function generatePdf(
  content: string,
  docType: DocType,
  meta: { name?: string; company?: string; title?: string }
): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(content, docType, meta), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      // Margins are baked into the HTML padding for the resume so Puppeteer doesn't add extra
      margin: docType === 'resume'
        ? { top: '0', bottom: '0', left: '0', right: '0' }
        : { top: '0.75in', bottom: '0.75in', left: '1in', right: '1in' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
