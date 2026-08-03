export type TextBlockKind = 'heading' | 'paragraph' | 'bullets' | 'note';

export interface TextBlock {
  kind: TextBlockKind;
  text?: string;
  items?: string[];
}

// The AI guidance and the LLaMA report both arrive as free text that the doctor
// can edit, so the shape is a convention rather than a contract: short lines
// ending in ':' act as section titles, '-' or '•' lines as bullets. Anything
// unexpected degrades to a plain paragraph rather than being dropped.
const HEADING_MAX_LENGTH = 90;
const BULLET_PREFIX = /^\s*[-•*]\s+/;
const NUMBERED_PREFIX = /^\s*\d+[.)]\s+/;
const DISCLAIMER = /ne le remplacent? pas|ne remplace pas/i;
// The model titles sections inconsistently — "**Next steps :**" one run,
// "**Next steps**" the next — so a fully bolded short line counts as a heading
// whether or not it carries the colon.
const BOLD_LINE = /^\s*\*\*(.+?)\*\*\s*:?\s*$/;

function clean(line: string): string {
  return line
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/, '')
    .trim();
}

export function parseStructuredText(raw: string | null | undefined): TextBlock[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  const blocks: TextBlock[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push({ kind: 'bullets', items: bullets });
      bullets = [];
    }
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = clean(rawLine);

    if (!line) {
      flushBullets();
      continue;
    }

    if (BULLET_PREFIX.test(rawLine) || NUMBERED_PREFIX.test(rawLine)) {
      bullets.push(line.replace(BULLET_PREFIX, '').replace(NUMBERED_PREFIX, ''));
      continue;
    }

    flushBullets();

    const bold = rawLine.match(BOLD_LINE);

    if (DISCLAIMER.test(line)) {
      blocks.push({ kind: 'note', text: line });
    } else if (bold && bold[1].trim().length <= HEADING_MAX_LENGTH) {
      blocks.push({ kind: 'heading', text: bold[1].replace(/\s*:$/, '').trim() });
    } else if (line.endsWith(':') && line.length <= HEADING_MAX_LENGTH) {
      blocks.push({ kind: 'heading', text: line.replace(/\s*:$/, '') });
    } else {
      blocks.push({ kind: 'paragraph', text: line });
    }
  }

  flushBullets();
  return blocks;
}

// The report's leading "[AI-GENERATED DRAFT — ...]" marker is rendered as a
// badge by the UI, so it is peeled off the body it prefixes.
export function splitDraftBanner(raw: string | null | undefined): { banner: string | null; body: string } {
  const text = (raw ?? '').trim();
  const match = text.match(/^\[([^\]]+)\]\s*/);
  if (!match) {
    return { banner: null, body: text };
  }
  return { banner: match[1].trim(), body: text.slice(match[0].length).trim() };
}
