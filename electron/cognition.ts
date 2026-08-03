import { net } from 'electron';
import { getLearningContent, type LearningCategoryId } from './learning';

export type CognitionCategoryId = 'digest' | LearningCategoryId;
export type CognitionMode = 'current' | 'growth';

interface DomesticFeed {
  name: string;
  url: string;
}

interface CognitionBoard {
  id: Exclude<CognitionCategoryId, 'digest'>;
  label: string;
  feeds: DomesticFeed[];
  keywords: RegExp;
}

interface FeedItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
}

const feeds = {
  xinhuaPolitics: { name: '新华网·时政', url: 'https://www.xinhuanet.com/politics/news_politics.xml' },
  xinhuaWorld: { name: '新华网·国际', url: 'https://www.xinhuanet.com/world/news_world.xml' },
  xinhuaTechnology: { name: '新华网·科技', url: 'https://www.xinhuanet.com/tech/news_tech.xml' },
  xinhuaFinance: { name: '新华网·财经', url: 'https://www.xinhuanet.com/fortune/news_fortune.xml' },
  xinhuaHealth: { name: '新华网·健康', url: 'https://www.xinhuanet.com/health/news_health.xml' },
  xinhuaLaw: { name: '新华网·法治', url: 'https://www.xinhuanet.com/legal/news_legal.xml' },
  peoplePolitics: { name: '人民网·时政', url: 'https://www.people.com.cn/rss/politics.xml' },
  peopleSociety: { name: '人民网·社会', url: 'https://www.people.com.cn/rss/society.xml' },
  peopleCulture: { name: '人民网·文化', url: 'https://www.people.com.cn/rss/culture.xml' },
  peopleFinance: { name: '人民网·财经', url: 'https://www.people.com.cn/rss/finance.xml' },
  peopleTechnology: { name: '人民网·科技', url: 'https://www.people.com.cn/rss/it.xml' },
  peopleHealth: { name: '人民网·健康', url: 'https://www.people.com.cn/rss/health.xml' },
  peopleLaw: { name: '人民网·法治', url: 'https://www.people.com.cn/rss/legal.xml' },
  chinaNewsLatest: { name: '中国新闻网·即时', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
  chinaNewsPolitics: { name: '中国新闻网·时政', url: 'https://www.chinanews.com.cn/rss/china.xml' },
  chinaNewsWorld: { name: '中国新闻网·国际', url: 'https://www.chinanews.com.cn/rss/world.xml' },
  chinaNewsSociety: { name: '中国新闻网·社会', url: 'https://www.chinanews.com.cn/rss/society.xml' },
  chinaNewsFinance: { name: '中国新闻网·财经', url: 'https://www.chinanews.com.cn/rss/finance.xml' },
  chinaNewsHealth: { name: '中国新闻网·健康', url: 'https://www.chinanews.com.cn/rss/jk.xml' },
  chinaNewsLaw: { name: '中国新闻网·法治', url: 'https://www.chinanews.com.cn/rss/fz.xml' },
  chinaNewsTheory: { name: '中国新闻网·理论', url: 'https://www.chinanews.com.cn/rss/theory.xml' },
  chinaNewsCulture: { name: '中国新闻网·文化', url: 'https://www.chinanews.com.cn/rss/culture.xml' },
  krGeneral: { name: '36氪·综合资讯', url: 'https://36kr.com/feed' },
  krArticles: { name: '36氪·文章', url: 'https://36kr.com/feed-article' },
  krNewsflash: { name: '36氪·快讯', url: 'https://36kr.com/feed-newsflash' },
} satisfies Record<string, DomesticFeed>;

const boards: CognitionBoard[] = [
  {
    id: 'politics',
    label: '政治与格局',
    feeds: [feeds.xinhuaPolitics, feeds.xinhuaWorld, feeds.peoplePolitics, feeds.chinaNewsPolitics, feeds.chinaNewsWorld],
    keywords: /中国|国内|政策|治理|外交|国际|社会|政治|国务院|改革|民生|发展|安全|合作|会议/,
  },
  {
    id: 'thinking',
    label: '思维与经典',
    feeds: [feeds.chinaNewsTheory, feeds.peopleCulture, feeds.chinaNewsCulture, feeds.peopleSociety],
    keywords: /社会|文化|教育|阅读|读书|思想|思维|历史|经典|文明|理论|观察|研究|传统/,
  },
  {
    id: 'psychology',
    label: '心理与人际',
    feeds: [feeds.peopleHealth, feeds.peopleSociety, feeds.chinaNewsHealth, feeds.chinaNewsSociety],
    keywords: /心理|认知|人际|情绪|精神健康|精神卫生|睡眠|压力|职场|青少年心理|家庭关系|沟通|抑郁|焦虑/,
  },
  {
    id: 'law',
    label: '法律与民法',
    feeds: [feeds.peopleLaw, feeds.xinhuaLaw, feeds.chinaNewsLaw, feeds.chinaNewsSociety],
    keywords: /民法|民事|合同|侵权|婚姻|劳动|法律|法治|司法|法院|检察|纠纷|权益|案件|执法/,
  },
  {
    id: 'economy',
    label: '经济与财富',
    feeds: [feeds.peopleFinance, feeds.xinhuaFinance, feeds.chinaNewsFinance, feeds.krNewsflash],
    keywords: /经济|货币|金融|资本|资金|股市|股票|基金|投资|理财|消费|就业|通胀|市场|企业|价格|产业/,
  },
  {
    id: 'business',
    label: '商业思维',
    feeds: [feeds.krGeneral, feeds.krArticles, feeds.chinaNewsFinance, feeds.xinhuaFinance],
    keywords: /商业|公司|企业|战略|消费|品牌|创业|融资|行业|市场|渠道|零售|利润|现金流|产品|增长/,
  },
  {
    id: 'technology',
    label: '科技与 AI',
    feeds: [feeds.xinhuaTechnology, feeds.peopleTechnology, feeds.krGeneral, feeds.krNewsflash],
    keywords: /人工智能|\bAI\b|大模型|芯片|量子|机器人|算法|算力|科技(?!指数)|科学|科研|数字技术|智能|软件|硬件/i,
  },
  {
    id: 'medicine',
    label: '中医药与针灸',
    feeds: [feeds.chinaNewsHealth, feeds.peopleHealth, feeds.xinhuaHealth],
    keywords: /中医|针灸|中药|穴位|经络|药材|医疗|医学|临床|健康|疾病|医院|药物|养生/,
  },
  {
    id: 'energy',
    label: '电力与能源',
    feeds: [feeds.xinhuaFinance, feeds.xinhuaTechnology, feeds.peopleFinance, feeds.krNewsflash],
    keywords: /电网|电力|能源|新能源|储能|光伏|风电|核电|用电|输电|电价|充电|煤炭|石油|天然气/,
  },
];

const blockedPatterns = [
  /毒鸡汤/i,
  /\bemo\b/i,
  /情绪文案|伤感文案|视频文案/i,
  /扎心|破防|看完沉默|瞬间清醒|狠狠共鸣|人间清醒/i,
  /一定要看|毁掉你|治愈系|成年人.*崩溃/i,
  /送达.*告知书/i,
  /招聘|招标|采购公告/i,
  /名单公示|评选结果/i,
  /^新闻联播$/i,
  /活动举行|会议召开/i,
  /校院企地.*联姻/i,
  /破产|清算|财产分配公告/i,
  /要闻盘点|竣工验收/i,
  /课程介绍|教学大纲/i,
  /关于同意.*批复|许可证|名单公布/i,
  /落户|招商|投资促进/i,
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WorkBench-Desktop/0.1.1',
  Accept: 'application/rss+xml,application/xml,text/xml,*/*;q=0.6',
  'Cache-Control': 'no-cache',
};

const feedCache = new Map<string, { expiresAt: number; items: FeedItem[] }>();
const feedCacheDuration = 5 * 60 * 1000;

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

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function parseFeed(xml: string, feed: DomesticFeed) {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.map((block, index) => {
    const title = getTag(block, 'title').replace(/\s+[-_—|]\s*(新华网|人民网|中国新闻网|36氪)$/i, '').trim();
    const url = safeHttpUrl(getTag(block, 'link') || getTag(block, 'guid'));
    const summary = getTag(block, 'description') || getTag(block, 'content:encoded');
    const publishedAt = getTag(block, 'pubDate') || getTag(block, 'dc:date') || getTag(block, 'date');
    return {
      id: `${feed.name}-${index}-${url || title}`,
      title,
      url,
      summary: summary.slice(0, 320),
      source: feed.name,
      publishedAt,
    };
  }).filter((item) => item.title && item.url);
}

async function requestFeed(feed: DomesticFeed, bypassCache: boolean) {
  const cached = feedCache.get(feed.url);
  if (!bypassCache && cached && cached.expiresAt > Date.now()) return cached.items;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await net.fetch(feed.url, {
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`${feed.name} HTTP ${response.status}`);
    const items = parseFeed(await response.text(), feed);
    if (!items.length) throw new Error(`${feed.name} 暂无可解析内容`);
    feedCache.set(feed.url, { expiresAt: Date.now() + feedCacheDuration, items });
    return items;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBoard(board: CognitionBoard, bypassCache: boolean) {
  const results = await Promise.allSettled(board.feeds.map((feed) => requestFeed(feed, bypassCache)));
  return results
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .filter((item) => {
      const searchable = `${item.title} ${item.summary}`;
      return (
        item.title.length >= 8 &&
        board.keywords.test(item.title) &&
        !blockedPatterns.some((pattern) => pattern.test(searchable))
      );
    })
    .filter((item, index, array) => (
      array.findIndex((candidate) => candidate.url === item.url || candidate.title === item.title) === index
    ))
    .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
    .slice(0, 18)
    .map((item) => ({
      ...item,
      category: board.id,
      categoryLabel: board.label,
    }));
}

export async function fetchCognitionContent(
  category: CognitionCategoryId = 'digest',
  mode: CognitionMode = 'current',
  refreshKey = 0,
) {
  if (mode === 'growth') {
    return {
      items: getLearningContent(category, new Date(), refreshKey),
      fetchedAt: new Date().toISOString(),
      category,
      mode,
    };
  }

  const selectedBoards = category === 'digest' ? boards : boards.filter((board) => board.id === category);
  const results = await Promise.allSettled(selectedBoards.map((board) => fetchBoard(board, refreshKey > 0)));
  const perBoardLimit = category === 'digest' ? 2 : 12;
  const items = results
    .flatMap((result) => result.status === 'fulfilled' ? result.value.slice(0, perBoardLimit) : [])
    .filter((item, index, array) => (
      array.findIndex((candidate) => candidate.url === item.url || candidate.title === item.title) === index
    ))
    .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
    .slice(0, category === 'digest' ? 14 : 12);

  if (!items.length) throw new Error('国内直连资讯源暂时没有获取到合适内容，请稍后重试。');
  return {
    items,
    fetchedAt: new Date().toISOString(),
    category,
    mode,
  };
}
