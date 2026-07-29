import { ipcMain, net, Notification, shell } from 'electron';
import { CognitionCategoryId, CognitionMode, fetchCognitionContent } from './cognition';

interface FeedSource {
  name: string;
  url: string;
}

interface GitHubRankingRequest {
  category: 'projects' | 'skills';
  period: 'all' | 'week';
}

const feedSources: FeedSource[] = [
  { name: '科技爱好者周刊', url: 'https://www.ruanyifeng.com/blog/atom.xml' },
  { name: '少数派', url: 'https://sspai.com/feed' },
];

const requestHeaders = {
  'User-Agent': 'WorkBench-Desktop/0.1',
  Accept: 'application/xml,text/xml,application/atom+xml,application/rss+xml,text/html;q=0.8,*/*;q=0.5',
};

async function fetchWithTimeout(url: string, headers: Record<string, string> = requestHeaders, timeout = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await net.fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function decodeXml(value: string) {
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

function cleanText(value: string) {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function getLink(block: string) {
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atomLink) return decodeXml(atomLink[1].trim());
  return getTag(block, 'link');
}

function parseFeed(xml: string, source: FeedSource) {
  const blocks = xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return blocks
    .map((block, index) => {
      const title = getTag(block, 'title');
      const url = getLink(block);
      const summary = getTag(block, 'description') || getTag(block, 'summary') || getTag(block, 'content');
      const publishedAt = getTag(block, 'pubDate') || getTag(block, 'published') || getTag(block, 'updated');
      return {
        id: `${source.name}-${index}-${url || title}`,
        title,
        url,
        summary: summary.slice(0, 220),
        source: source.name,
        publishedAt,
      };
    })
    .filter((item) => item.title && item.url);
}

async function fetchDailyContent() {
  const results = await Promise.allSettled(
    feedSources.map(async (source) => {
      const response = await fetchWithTimeout(source.url);
      const xml = await response.text();
      return parseFeed(xml, source);
    }),
  );

  const items = results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .filter((item, index, array) => array.findIndex((candidate) => candidate.url === item.url) === index)
    .sort((a, b) => {
      const aTime = Date.parse(a.publishedAt) || 0;
      const bTime = Date.parse(b.publishedAt) || 0;
      return bTime - aTime;
    })
    .slice(0, 12);

  if (!items.length) throw new Error('暂时无法读取中文内容源，请稍后重试。');
  return { items, fetchedAt: new Date().toISOString() };
}

function weekStart() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

async function fetchGitHubRanking(request: GitHubRankingRequest) {
  const { category, period } = request;
  const weeklyQualifier = period === 'week' ? ` created:>=${weekStart()}` : '';
  const query =
    category === 'skills'
      ? `topic:agent-skills archived:false${weeklyQualifier}`
      : `${period === 'all' ? 'stars:>5000' : 'stars:>10'} archived:false${weeklyQualifier}`;

  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: '12',
    refresh: Date.now().toString(),
  });
  const response = await fetchWithTimeout(
    `https://api.github.com/search/repositories?${params.toString()}`,
    {
      'User-Agent': 'WorkBench-Desktop/0.1',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  );
  const payload = (await response.json()) as {
    items?: Array<{
      id: number;
      full_name: string;
      html_url: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      language: string | null;
      owner: { avatar_url: string };
      updated_at: string;
      topics?: string[];
    }>;
  };

  const repositories = (payload.items ?? []).map((repo) => ({
    id: repo.id,
    name: repo.full_name,
    url: repo.html_url,
    description: repo.description || 'No description provided.',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    avatar: repo.owner.avatar_url,
    updatedAt: repo.updated_at,
    topics: repo.topics ?? [],
  }));

  return {
    repositories,
    fetchedAt: new Date().toISOString(),
    scope: period === 'week' ? weekStart() : 'all',
  };
}

function isSafeWebUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string') return false;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const dailyCache: Partial<Record<CognitionMode, Awaited<ReturnType<typeof fetchCognitionContent>>>> = {};
let growthRotation = 0;

function millisecondsUntilNextEight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function refreshDailyCache(mode: CognitionMode, showNotification: boolean, rotation = 0) {
  const response = await fetchCognitionContent('digest', mode, rotation);
  dailyCache[mode] = response;
  if (showNotification && Notification.isSupported() && response.items[0]) {
    new Notification({
      title: mode === 'current' ? '每日资讯已更新' : '认知提升已更新',
      body: response.items[0].title.slice(0, 180),
    }).show();
  }
  return response;
}

function scheduleDailyRefresh() {
  const timer = setTimeout(async () => {
    await Promise.allSettled([
      refreshDailyCache('current', true),
      refreshDailyCache('growth', false),
    ]);
    scheduleDailyRefresh();
  }, millisecondsUntilNextEight());
  timer.unref();
}

export function registerContentIpc() {
  void Promise.allSettled([
    refreshDailyCache('current', false),
    refreshDailyCache('growth', false),
  ]);
  scheduleDailyRefresh();
  ipcMain.handle('content:get-daily', (
    _event,
    category: CognitionCategoryId = 'digest',
    mode: CognitionMode = 'current',
    force = false,
  ) => {
    const selectedMode: CognitionMode = mode === 'growth' ? 'growth' : 'current';
    const refreshKey = force ? (selectedMode === 'growth' ? ++growthRotation : Date.now()) : 0;
    if (category === 'digest') return force ? refreshDailyCache(selectedMode, false, refreshKey) : dailyCache[selectedMode] ?? refreshDailyCache(selectedMode, false);
    return fetchCognitionContent(category, selectedMode, refreshKey);
  });
  ipcMain.handle('content:get-github', (_event, request: GitHubRankingRequest) => fetchGitHubRanking(request));
  ipcMain.handle('content:open-external', async (_event, rawUrl: unknown) => {
    if (!isSafeWebUrl(rawUrl)) return false;
    await shell.openExternal(rawUrl);
    return true;
  });
  ipcMain.on('content:notify', (_event, payload: unknown) => {
    if (!Notification.isSupported() || !payload || typeof payload !== 'object') return;
    const { title, body } = payload as { title?: unknown; body?: unknown };
    if (typeof title !== 'string' || typeof body !== 'string') return;
    new Notification({ title: title.slice(0, 80), body: body.slice(0, 240) }).show();
  });
}
