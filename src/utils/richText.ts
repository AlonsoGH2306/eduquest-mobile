export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold' | 'italic' | 'strike' | 'spoiler'; children: InlineToken[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string }
  | { type: 'mention'; username: string };

export type Block =
  | { type: 'paragraph'; lines: InlineToken[][] }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] }
  | { type: 'codeBlock'; value: string };

const INLINE =
  /(`[^`\n]+`)|(\|\|[^|\n]+\|\|)|(\*\*[^*\n]+\*\*)|(~~[^~\n]+~~)|(\*[^*\n]+\*|_[^_\n]+_)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|(@[A-Za-z0-9_.-]{3,30})/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: 'text', value: text.slice(last, index) });
    const [whole, code, spoiler, bold, strike, italic, link, mention] = match;
    if (code) tokens.push({ type: 'code', value: code.slice(1, -1) });
    else if (spoiler) tokens.push({ type: 'spoiler', children: parseInline(spoiler.slice(2, -2)) });
    else if (bold) tokens.push({ type: 'bold', children: parseInline(bold.slice(2, -2)) });
    else if (strike) tokens.push({ type: 'strike', children: parseInline(strike.slice(2, -2)) });
    else if (italic) tokens.push({ type: 'italic', children: parseInline(italic.slice(1, -1)) });
    else if (link) tokens.push({ type: 'link', href: link });
    else if (mention) tokens.push({ type: 'mention', username: mention.slice(1) });
    last = index + whole.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function parseLines(text: string, blocks: Block[]) {
  let paragraph: InlineToken[][] = [];
  let list: { ordered: boolean; items: InlineToken[][] } | null = null;
  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ...list });
    list = null;
  };
  for (const line of text.split('\n')) {
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      const ordered = numbered !== null;
      flushParagraph();
      if (list && list.ordered !== ordered) flushList();
      list = list ?? { ordered, items: [] };
      list.items.push(parseInline(item[1]));
    } else {
      flushList();
      paragraph.push(parseInline(line));
    }
  }
  flushParagraph();
  flushList();
}

export function parseRichText(content: string): Block[] {
  const blocks: Block[] = [];
  const parts = content.split('```');
  parts.forEach((part, index) => {
    const insideFence = index % 2 === 1 && index < parts.length - 1;
    if (insideFence) {
      blocks.push({ type: 'codeBlock', value: part.replace(/^[a-z]*\n/i, '').replace(/\n$/, '') });
    } else {
      const text = index % 2 === 1 ? '```' + part : part;
      const trimmed = text.replace(/^\n+|\n+$/g, '');
      if (trimmed) parseLines(trimmed, blocks);
    }
  });
  return blocks;
}

export const MENTION_QUERY = /(?:^|\s)@([A-Za-z0-9_.-]{0,30})$/;
