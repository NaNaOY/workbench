import { net } from 'electron';
import { normalizeArticleUrl } from './article-url';
import { parseFeed, type ParsedFeedItem } from './feed';
import type { LearningCategoryId, LearningItem } from './learning';

export type OverseasCategoryId = 'digest' | LearningCategoryId;

interface OverseasSeed {
  title: string;
  url: string;
  summary: string;
  source: 'Wikipedia' | 'Wikisource';
}

interface OverseasBoard {
  id: LearningCategoryId;
  label: string;
  query: string;
  seeds: OverseasSeed[];
}

function wikipedia(topic: string) {
  return `https://zh.wikipedia.org/wiki/${encodeURIComponent(topic)}`;
}

function wikisource(topic: string) {
  return `https://zh.wikisource.org/wiki/${encodeURIComponent(topic)}`;
}

const boards: OverseasBoard[] = [
  {
    id: 'politics',
    label: '政治与格局',
    query: '国际政治 地缘政治 全球治理 when:7d',
    seeds: [
      { title: '国际关系：国家之间如何合作、竞争与形成秩序', url: wikipedia('国际关系'), source: 'Wikipedia', summary: '从国家、国际组织和非国家行为体出发，理解权力、安全、合作与制度如何共同塑造国际秩序。' },
      { title: '地缘政治学：空间、资源与国家战略之间的关系', url: wikipedia('地缘政治学'), source: 'Wikipedia', summary: '观察地理位置、资源禀赋、交通通道与安全边界如何影响国家战略选择。' },
      { title: '政治学：理解权力、制度和公共决策的基础框架', url: wikipedia('政治学'), source: 'Wikipedia', summary: '建立分析政治制度、公共权力、集体选择和治理过程的基础概念。' },
    ],
  },
  {
    id: 'thinking',
    label: '思维与经典',
    query: '经典阅读 历史 思维方法 哲学 when:7d',
    seeds: [
      { title: '《道德经》原文：从反者道之动理解变化与边界', url: wikisource('道德經'), source: 'Wikisource', summary: '直接阅读经典原文，观察“有无相生”“反者道之动”等命题如何用于理解变化、节制与行动。' },
      { title: '《资治通鉴》原文：从长期历史中观察治理得失', url: wikisource('資治通鑑'), source: 'Wikisource', summary: '通过编年史中的制度、人物与决策，训练跨时间比较和因果判断能力。' },
      { title: '《史记》原文：在人与时代的互动中理解选择', url: wikisource('史記'), source: 'Wikisource', summary: '从本纪、世家和列传中观察个人动机、组织关系与时代约束如何共同决定结果。' },
    ],
  },
  {
    id: 'psychology',
    label: '心理与人际',
    query: '心理学 认知 情绪 人际关系 研究 when:7d',
    seeds: [
      { title: '认知偏误：大脑为什么会系统性地判断失准', url: wikipedia('认知偏误'), source: 'Wikipedia', summary: '认识启发式、确认偏误和框架效应，区分高效直觉与容易重复出现的判断错误。' },
      { title: '社会心理学：情境如何改变人的态度与行为', url: wikipedia('社会心理学'), source: 'Wikipedia', summary: '从从众、归因、群体规范和社会认同等机制理解真实的人际互动。' },
      { title: '情绪智力：识别、理解和调节情绪的能力', url: wikipedia('情绪智力'), source: 'Wikipedia', summary: '把情绪视为信息，练习识别感受、理解诱因并选择更有效的表达与行动。' },
    ],
  },
  {
    id: 'law',
    label: '法律与民法',
    query: '民法 法律 判例 权利 国际 when:7d',
    seeds: [
      { title: '民法：权利、义务与私人关系的基本规则', url: wikipedia('民法'), source: 'Wikipedia', summary: '从主体、法律行为、物权、合同、侵权和家庭关系理解民事法律体系。' },
      { title: '契约：承诺如何转化为可执行的权利义务', url: wikipedia('契约'), source: 'Wikipedia', summary: '理解合同成立、意思表示、履行、违约与救济之间的基本逻辑。' },
      { title: '侵权行为：损害、过错、因果关系与责任边界', url: wikipedia('侵权行为'), source: 'Wikipedia', summary: '分析损害发生后应由谁承担责任，以及证据和因果关系如何影响结论。' },
    ],
  },
  {
    id: 'economy',
    label: '经济与财富',
    query: '全球经济 金融市场 货币政策 投资 when:7d',
    seeds: [
      { title: '宏观经济学：增长、通胀、就业与政策如何联动', url: wikipedia('宏观经济学'), source: 'Wikipedia', summary: '用总需求、总供给、货币与财政政策理解经济周期和主要宏观指标。' },
      { title: '行为经济学：现实决策为何偏离完全理性', url: wikipedia('行为经济学'), source: 'Wikipedia', summary: '把心理机制引入经济决策，理解损失厌恶、锚定与有限理性。' },
      { title: '资产配置：在收益、风险与流动性之间做组合', url: wikipedia('资产配置'), source: 'Wikipedia', summary: '从相关性、风险承受能力和投资期限出发，理解组合而非单一资产的决策方式。' },
    ],
  },
  {
    id: 'business',
    label: '商业思维',
    query: '商业模式 企业战略 市场竞争 创业 when:7d',
    seeds: [
      { title: '商业模式：企业如何创造、交付并获取价值', url: wikipedia('商业模式'), source: 'Wikipedia', summary: '从用户价值、关键活动、成本结构和收入来源拆解一门生意。' },
      { title: '竞争优势：企业为什么能长期获得超额回报', url: wikipedia('竞争优势'), source: 'Wikipedia', summary: '观察成本、差异化、网络效应、转换成本和组织能力是否能够持续。' },
      { title: '市场营销：从需求洞察到价值交换的完整过程', url: wikipedia('市场营销'), source: 'Wikipedia', summary: '理解细分、定位、产品、渠道、价格和传播如何形成一致的市场策略。' },
    ],
  },
  {
    id: 'technology',
    label: '科技与 AI',
    query: '人工智能 大模型 科技突破 AI when:7d',
    seeds: [
      { title: '人工智能：让机器完成感知、推理与行动任务', url: wikipedia('人工智能'), source: 'Wikipedia', summary: '从符号主义、机器学习和智能体等路线理解人工智能的能力来源与限制。' },
      { title: '大型语言模型：从下一个词预测到通用交互能力', url: wikipedia('大型语言模型'), source: 'Wikipedia', summary: '理解预训练、上下文、微调与推理等概念，以及语言流畅和事实可靠之间的区别。' },
      { title: '机器学习：从数据中建立可泛化的预测规则', url: wikipedia('机器学习'), source: 'Wikipedia', summary: '区分监督学习、无监督学习和强化学习，并关注数据、目标函数与评估方式。' },
    ],
  },
  {
    id: 'medicine',
    label: '中医药与针灸',
    query: '医学研究 循证医学 中医 针灸 when:7d',
    seeds: [
      { title: '循证医学：把最佳证据与临床经验结合起来', url: wikipedia('循证医学'), source: 'Wikipedia', summary: '理解研究设计、证据等级、效应大小和适用人群，避免把单一研究当成确定结论。' },
      { title: '针灸：传统实践、现代研究与证据争议', url: wikipedia('针灸'), source: 'Wikipedia', summary: '同时了解理论来源、操作方式、临床研究和安全边界，不替代专业诊断。' },
      { title: '中医学：整体观念、辨证论治与现代研究', url: wikipedia('中医学'), source: 'Wikipedia', summary: '从历史体系、核心概念和现代评价三个层面理解中医学。' },
    ],
  },
  {
    id: 'energy',
    label: '电力与能源',
    query: '能源转型 电力系统 储能 可再生能源 when:7d',
    seeds: [
      { title: '电力系统：发电、输电、配电与负荷的实时平衡', url: wikipedia('电力系统'), source: 'Wikipedia', summary: '理解频率、电压、调度、可靠性和网络约束为何使电力系统不同于普通商品系统。' },
      { title: '可再生能源：低碳供给与波动性之间的权衡', url: wikipedia('可再生能源'), source: 'Wikipedia', summary: '比较风能、太阳能、水能等技术的资源特征、系统成本和环境影响。' },
      { title: '能源经济学：价格、资源、安全与环境约束', url: wikipedia('能源经济学'), source: 'Wikipedia', summary: '从供需、外部性、基础设施和公共政策理解能源系统的经济选择。' },
    ],
  },
];

const feedCache = new Map<string, { expiresAt: number; items: ParsedFeedItem[] }>();
const feedCacheDuration = 10 * 60 * 1000;
let googleRetryAfter = 0;

function googleNewsFeed(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: 'zh-CN',
    gl: 'CN',
    ceid: 'CN:zh-Hans',
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

async function requestGoogleNews(board: OverseasBoard, bypassCache: boolean) {
  const url = googleNewsFeed(board.query);
  const cached = feedCache.get(url);
  if (!bypassCache && cached && cached.expiresAt > Date.now()) return cached.items;
  if (!bypassCache && googleRetryAfter > Date.now()) throw new Error('Google 新闻当前网络不可达');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await net.fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WorkBench-Desktop/0.2.0',
        Accept: 'application/rss+xml,application/xml,text/xml,*/*;q=0.6',
      },
    });
    if (!response.ok) throw new Error(`Google 新闻 HTTP ${response.status}`);
    const items = parseFeed(await response.text(), { name: 'Google 新闻' }, {
      includeEntries: false,
      linkTags: ['link', 'guid'],
      summaryTags: ['description'],
      publishedTags: ['pubDate'],
      summaryLength: 260,
      normalizeTitle: (title) => title.replace(/\s+-\s+[^-]{1,80}$/, '').trim(),
      normalizeUrl: (rawUrl) => normalizeArticleUrl(rawUrl, { allowInternationalSources: true }),
    });
    feedCache.set(url, { expiresAt: Date.now() + feedCacheDuration, items });
    googleRetryAfter = 0;
    return items;
  } catch (reason) {
    googleRetryAfter = Date.now() + 60_000;
    throw reason;
  } finally {
    clearTimeout(timer);
  }
}

function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function staticItems(board: OverseasBoard, date: Date, rotation: number): LearningItem[] {
  const offset = (dayNumber(date) + rotation) % board.seeds.length;
  return board.seeds.map((_, index) => {
    const seedIndex = (index + offset) % board.seeds.length;
    const seed = board.seeds[seedIndex];
    return {
      ...seed,
      id: `overseas-${board.id}-${seed.source.toLowerCase()}-${seedIndex}`,
      publishedAt: date.toISOString(),
      category: board.id,
      categoryLabel: board.label,
    };
  });
}

function googleItems(board: OverseasBoard, items: ParsedFeedItem[]): LearningItem[] {
  return items.slice(0, 4).map((item, index) => ({
    ...item,
    id: `overseas-${board.id}-google-${index}-${item.id}`,
    summary: item.summary || '来自 Google 新闻聚合的近期报道。请打开原文核对事实、出处与发布时间。',
    source: 'Google 新闻',
    category: board.id,
    categoryLabel: board.label,
  }));
}

async function getBoardItems(board: OverseasBoard, date: Date, rotation: number, bypassCache: boolean) {
  const fallback = staticItems(board, date, rotation);
  try {
    const live = googleItems(board, await requestGoogleNews(board, bypassCache));
    return [...live, ...fallback]
      .filter((item, index, items) => items.findIndex((candidate) => candidate.url === item.url || candidate.title === item.title) === index)
      .slice(0, 6);
  } catch {
    return fallback;
  }
}

export async function fetchOverseasContent(
  category: OverseasCategoryId = 'digest',
  refreshKey = 0,
) {
  const now = new Date();
  const selectedBoards = category === 'digest' ? boards : boards.filter((board) => board.id === category);
  const results = await Promise.all(selectedBoards.map((board, index) => (
    getBoardItems(board, now, refreshKey + index, refreshKey > 0)
  )));

  const items = category === 'digest'
    ? results.flatMap((boardItems) => boardItems.slice(0, 2)).slice(0, 14)
    : results.flat().slice(0, 6);

  return {
    items,
    fetchedAt: now.toISOString(),
    category,
    mode: 'overseas' as const,
  };
}
