export interface FeedSource {
  name: string;
}

export interface ParsedFeedItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
}

export interface FeedParserOptions {
  includeEntries?: boolean;
  linkTags?: readonly string[];
  summaryTags?: readonly string[];
  publishedTags?: readonly string[];
  summaryLength?: number;
  normalizeTitle?: (title: string) => string;
  normalizeUrl?: (url: string) => string;
}

const defaultSummaryTags = ['description', 'summary', 'content'] as const;
const defaultPublishedTags = ['pubDate', 'published', 'updated'] as const;

export function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;|&#160;|&#x0*a0;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function cleanText(value: string) {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function getLink(block: string, names: readonly string[]) {
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atomLink) return decodeXml(atomLink[1].trim());
  for (const name of names) {
    const value = getTag(block, name);
    if (value) return value;
  }
  return '';
}

export function parseFeed(xml: string, source: FeedSource, options: FeedParserOptions = {}): ParsedFeedItem[] {
  const itemNames = options.includeEntries === false ? 'item' : '(?:item|entry)';
  const blocks = xml.match(new RegExp(`<${itemNames}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${itemNames}>`, 'gi')) ?? [];
  const summaryTags = options.summaryTags ?? defaultSummaryTags;
  const publishedTags = options.publishedTags ?? defaultPublishedTags;
  const linkTags = options.linkTags ?? ['link'];
  const summaryLength = options.summaryLength ?? 220;

  return blocks
    .map((block, index) => {
      const rawTitle = getTag(block, 'title');
      const title = options.normalizeTitle ? options.normalizeTitle(rawTitle) : rawTitle;
      const rawUrl = getLink(block, linkTags);
      const url = options.normalizeUrl ? options.normalizeUrl(rawUrl) : rawUrl;
      const summary = summaryTags.map((tag) => getTag(block, tag)).find(Boolean) ?? '';
      const publishedAt = publishedTags.map((tag) => getTag(block, tag)).find(Boolean) ?? '';
      return {
        id: `${source.name}-${index}-${url || title}`,
        title,
        url,
        summary: summary.slice(0, summaryLength),
        source: source.name,
        publishedAt,
      };
    })
    .filter((item) => item.title && item.url);
}