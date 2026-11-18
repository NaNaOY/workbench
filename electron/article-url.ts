const CIVIL_CODE_URL =
  'https://flk.npc.gov.cn/detail?id=ff808081729d1efe01729d50b5c500bf&title=%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E6%B0%91%E6%B3%95%E5%85%B8';

const PERSONAL_INFORMATION_PROTECTION_LAW_URL =
  'https://flk.npc.gov.cn/detail?id=ff8081817b6472a3017b656cc2040044&title=%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E4%B8%AA%E4%BA%BA%E4%BF%A1%E6%81%AF%E4%BF%9D%E6%8A%A4%E6%B3%95';

const legacyArticleUrls = new Map<string, string>([
  ['https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm', CIVIL_CODE_URL],
  ['https://www.gov.cn/xinwen/2021-08/20/content_5632486.htm', PERSONAL_INFORMATION_PROTECTION_LAW_URL],
]);

const inaccessibleKnowledgeHosts = [
  'wikipedia.org',
  'wikisource.org',
  'news.google.com',
  'google.com',
] as const;

const homepagePaths = new Set(['', '/', '/index.htm', '/index.html', '/index.shtml']);

function matchesHost(hostname: string, blockedHost: string) {
  return hostname === blockedHost || hostname.endsWith(`.${blockedHost}`);
}

export interface NormalizeArticleUrlOptions {
  allowInternationalSources?: boolean;
}

export function normalizeArticleUrl(rawUrl: unknown, options: NormalizeArticleUrlOptions = {}) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const remapped = legacyArticleUrls.get(trimmed) ?? trimmed;
  try {
    const url = new URL(remapped);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';

    const hostname = url.hostname.toLowerCase();
    if (
      !options.allowInternationalSources &&
      inaccessibleKnowledgeHosts.some((host) => matchesHost(hostname, host))
    ) return '';

    const path = url.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (homepagePaths.has(path) && !url.search) return '';

    // The old government-site article routes now commonly fall back to the portal homepage.
    // Known pages are remapped above; unknown legacy routes are rejected rather than misleading users.
    if (matchesHost(hostname, 'gov.cn') && /^\/xinwen\/\d{4}-\d{2}\//.test(path)) return '';

    return url.toString();
  } catch {
    return '';
  }
}

export const officialLawUrls = {
  civilCode: CIVIL_CODE_URL,
  personalInformationProtection: PERSONAL_INFORMATION_PROTECTION_LAW_URL,
  civilProcedureInterpretation:
    'https://flk.npc.gov.cn/detail?id=ff80818181cdceb30181d801c31c4070&title=%E6%9C%80%E9%AB%98%E4%BA%BA%E6%B0%91%E6%B3%95%E9%99%A2%E5%85%B3%E4%BA%8E%E9%80%82%E7%94%A8%E3%80%8A%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E6%B0%91%E4%BA%8B%E8%AF%89%E8%AE%BC%E6%B3%95%E3%80%8B%E7%9A%84%E8%A7%A3%E9%87%8A',
} as const;
