import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  TabStopType,
  TabStopPosition,
  LevelFormat,
} from 'docx';

type DocType = 'resume' | 'coverLetter' | 'hiringManagerMessage' | 'whyCompany';

const PAGE_WIDTH_TWIP = 12240; // 8.5in in twips
const MARGIN_TWIP     = convertInchesToTwip(0.75);
const TEXT_WIDTH_TWIP = PAGE_WIDTH_TWIP - 2 * MARGIN_TWIP;

// ─── Inline parser ─────────────────────────────────────────────────────────────
// Converts **bold** and __italic__ markers into docx TextRun arrays.

function parseRuns(text: string, baseProps: { size?: number; italics?: boolean } = {}): TextRun[] {
  const runs: TextRun[] = [];
  // Combined regex for **bold** and __italic__
  const re = /(\*\*(.+?)\*\*)|(__((.+?)__))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      runs.push(new TextRun({ text: text.slice(last, match.index), ...baseProps }));
    }
    if (match[1]) {
      // **bold**
      runs.push(new TextRun({ text: match[2], bold: true, ...baseProps }));
    } else {
      // __italic__
      runs.push(new TextRun({ text: match[5] ?? match[4], italics: true, ...baseProps }));
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), ...baseProps }));
  }

  return runs.length ? runs : [new TextRun({ text, ...baseProps })];
}

// ─── Resume DOCX builder ───────────────────────────────────────────────────────

function buildResumeDocx(content: string, authorName?: string): Document {
  const lines = content.split('\n');

  const nonEmptyIdxs: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) nonEmptyIdxs.push(i);
  }

  const nameIdx    = nonEmptyIdxs[0] ?? -1;
  const contactIdx = nonEmptyIdxs[1] ?? -1;
  const nameLine    = nameIdx    >= 0 ? lines[nameIdx].trim()    : '';
  const contactLine = contactIdx >= 0 ? lines[contactIdx].trim() : '';
  const bodyLines   = lines.slice(Math.max(nameIdx, contactIdx) + 1);

  const paragraphs: Paragraph[] = [];

  // Name
  if (nameLine) {
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: nameLine, bold: true, size: 36 })],
    }));
  }

  // Contact
  if (contactLine) {
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: parseRuns(contactLine, { size: 18 }),
    }));
  }

  for (const line of bodyLines) {
    const trimmed  = line.trim();
    const isIndent = line.startsWith('  ') || line.startsWith('\t');

    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { before: 40, after: 0 } }));
      continue;
    }

    // ALL-CAPS section header
    const isAllCaps =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      trimmed.length < 60 &&
      !trimmed.startsWith('•') &&
      !trimmed.startsWith('♦') &&
      !/\d{4}/.test(trimmed);

    if (isAllCaps) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 2 } },
        children: [new TextRun({ text: trimmed, bold: true, size: 22 })],
      }));
      continue;
    }

    // ♦ sub-bullet
    if (trimmed.startsWith('♦')) {
      const text = trimmed.replace(/^♦\s*/, '');
      paragraphs.push(new Paragraph({
        spacing: { before: 0, after: 20 },
        indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.1) },
        children: [new TextRun({ text: '♦  ', size: 16 }), ...parseRuns(text, { size: 20 })],
      }));
      continue;
    }

    // • bullet with ||| two-column (company row or education row)
    if (trimmed.startsWith('•') && trimmed.includes(' ||| ')) {
      const withoutBullet = trimmed.replace(/^•\s*/, '');
      const sepIdx = withoutBullet.indexOf(' ||| ');
      const left   = withoutBullet.slice(0, sepIdx);
      const right  = withoutBullet.slice(sepIdx + 5);
      paragraphs.push(new Paragraph({
        spacing: { before: 60, after: 0 },
        tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH_TWIP }],
        children: [
          new TextRun({ text: '•  ', size: 20 }),
          ...parseRuns(left, { size: 20 }),
          new TextRun({ text: '\t', size: 20 }),
          ...parseRuns(right, { size: 20 }),
        ],
      }));
      continue;
    }

    // • bullet plain
    if (trimmed.startsWith('•')) {
      const text = trimmed.replace(/^•\s*/, '');
      paragraphs.push(new Paragraph({
        spacing: { before: 40, after: 0 },
        children: [new TextRun({ text: '•  ', size: 20 }), ...parseRuns(text, { size: 20 })],
      }));
      continue;
    }

    // Indented detail row with ||| (job title + date line)
    if (isIndent && trimmed.includes(' ||| ')) {
      const sepIdx = trimmed.indexOf(' ||| ');
      const left   = trimmed.slice(0, sepIdx);
      const right  = trimmed.slice(sepIdx + 5);
      paragraphs.push(new Paragraph({
        spacing: { before: 0, after: 0 },
        indent: { left: convertInchesToTwip(0.15) },
        tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH_TWIP - convertInchesToTwip(0.15) }],
        children: [
          ...parseRuns(left, { size: 20, italics: true }),
          new TextRun({ text: '\t', size: 20 }),
          ...parseRuns(right, { size: 20, italics: true }),
        ],
      }));
      continue;
    }

    // Indented continuation line (degree name)
    if (isIndent) {
      paragraphs.push(new Paragraph({
        spacing: { before: 0, after: 20 },
        indent: { left: convertInchesToTwip(0.15) },
        children: parseRuns(trimmed, { size: 20 }),
      }));
      continue;
    }

    // Plain paragraph (summary)
    paragraphs.push(new Paragraph({
      spacing: { before: 20, after: 20 },
      children: parseRuns(trimmed, { size: 20 }),
    }));
  }

  return new Document({
    creator: authorName || 'ApplyCompanion',
    title: 'Tailored Resume',
    sections: [{
      properties: {
        page: {
          margin: {
            top:    MARGIN_TWIP,
            bottom: MARGIN_TWIP,
            left:   MARGIN_TWIP,
            right:  MARGIN_TWIP,
          },
        },
      },
      children: paragraphs,
    }],
  });
}

// ─── Letter DOCX builder ───────────────────────────────────────────────────────

const LETTER_TITLE: Record<Exclude<DocType, 'resume'>, string> = {
  coverLetter: 'Cover Letter',
  hiringManagerMessage: 'Hiring Manager Message',
  whyCompany: 'Why This Company',
};

function buildLetterDocx(
  content: string,
  docType: Exclude<DocType, 'resume'>,
  meta: { name?: string; company?: string; title?: string }
): Document {
  const titleText = LETTER_TITLE[docType];
  const subtitle  = [meta.title, meta.company].filter(Boolean).join(' — ');
  const lines     = content.split('\n');

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: titleText, bold: true, size: 40, color: '6366f1' })],
      spacing: { after: 40 },
    }),
    ...(subtitle
      ? [new Paragraph({
          children: [new TextRun({ text: subtitle, italics: true, size: 20, color: '64748b' })],
          spacing: { after: 240 },
        })]
      : [new Paragraph({ spacing: { after: 160 } })]),
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
      continue;
    }
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      paragraphs.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
        children: parseRuns(trimmed.replace(/^[•\-]\s*/, ''), { size: 20 }),
      }));
      continue;
    }
    paragraphs.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      children: parseRuns(trimmed, { size: 20 }),
    }));
  }

  return new Document({
    creator: meta.name || 'ApplyCompanion',
    title: titleText,
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left:   convertInchesToTwip(1),
            right:  convertInchesToTwip(1),
          },
        },
      },
      children: paragraphs,
    }],
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateDocx(
  content: string,
  docType: DocType,
  meta: { name?: string; company?: string; title?: string }
): Promise<Buffer> {
  const doc =
    docType === 'resume'
      ? buildResumeDocx(content, meta.name)
      : buildLetterDocx(content, docType, meta);

  return Buffer.from(await Packer.toBuffer(doc));
}
