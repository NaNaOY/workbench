import { net } from 'electron';

export type CognitionCategoryId =
  | 'digest'
  | 'politics'
  | 'thinking'
  | 'psychology'
  | 'law'
  | 'economy'
  | 'technology'
  | 'medicine'
  | 'energy';

export type CognitionMode = 'current' | 'growth';

interface CognitionBoard {
  id: Exclude<CognitionCategoryId, 'digest'>;
  label: string;
  query: Record<CognitionMode, string>;
  keywords: Record<CognitionMode, RegExp>;
}

const boards: CognitionBoard[] = [
  {
    id: 'politics',
    label: '政治与格局',
    query: {
      current: '(政策 发布 解读 OR 国家治理 OR 国际形势 外交) (site:www.gov.cn OR site:mfa.gov.cn OR site:npc.gov.cn OR site:news.cn OR site:qstheory.cn) when:30d',
      growth: '(政治学 OR 国家治理 OR 国际关系 OR 地缘政治 OR 制度分析 OR 公共政策 方法) (site:cssn.cn OR site:theory.people.com.cn OR site:edu.cn OR site:news.cn) when:3650d',
    },
    keywords: {
      current: /政策|治理|外交|国际形势|国家战略|政治|国务院|改革|规划/,
      growth: /政治学|国家治理|国际关系|地缘政治|政治思维|制度|公共政策|治理|国家战略/,
    },
  },
  {
    id: 'thinking',
    label: '思维与经典',
    query: {
      current: '(战略思维 OR 系统思维 OR 辩证思维 OR 毛泽东选集 OR 资本论 OR 道德经 OR 资治通鉴 OR 史记) (site:qstheory.cn OR site:cssn.cn OR site:people.com.cn OR site:edu.cn) when:90d',
      growth: '(系统思维 方法 OR 批判性思维 OR 战略思维 OR 毛泽东 思想 OR 资本论 解读 OR 道德经 解读 OR 资治通鉴 OR 史记) (site:cssn.cn OR site:people.com.cn OR site:qstheory.cn OR site:edu.cn) when:3650d',
    },
    keywords: {
      current: /战略思维|系统思维|辩证思维|毛泽东|毛选|资本论|马克思|道德经|老子|资治通鉴|史记|司马迁/,
      growth: /系统思维|批判性思维|决策|思维方法|毛泽东|毛选|资本论|马克思|道德经|老子|资治通鉴|史记|司马迁/,
    },
  },
  {
    id: 'psychology',
    label: '心理与人际',
    query: {
      current: '(心理学 研究 OR 社会心理 OR 人际关系 OR 情商 OR 心理边界) (site:psych.ac.cn OR site:edu.cn OR site:cas.cn) when:60d',
      growth: '(心理学 原理 OR 社会心理学 OR 沟通方法 OR 人际关系 OR 情绪管理 OR 心理边界) (site:psych.ac.cn OR site:edu.cn OR site:cas.cn OR site:thepaper.cn) when:3650d',
    },
    keywords: {
      current: /心理|认知|人际|情商|人格|行为|沟通|边界|社会关系/,
      growth: /心理学|心理机制|社会心理|人际|沟通|情绪管理|人格|认知偏差|行为|边界/,
    },
  },
  {
    id: 'law',
    label: '法律与民法',
    query: {
      current: '(民法典 OR 民事纠纷 OR 法律常识 OR 典型案例) (site:court.gov.cn OR site:npc.gov.cn OR site:spp.gov.cn) when:60d',
      growth: '(民法典 解读 OR 合同 法律知识 OR 劳动争议 实务 OR 侵权责任 OR 证据规则) (site:court.gov.cn OR site:spp.gov.cn OR site:npc.gov.cn OR site:edu.cn OR site:chinacourt.org) when:3650d',
    },
    keywords: {
      current: /民法|民事|合同|侵权|婚姻家庭|劳动争议|法律|法治|司法|法院|检察|纠纷/,
      growth: /民法|民事|合同|侵权|婚姻家庭|劳动争议|法律知识|证据|诉讼|权利|责任|司法实务/,
    },
  },
  {
    id: 'economy',
    label: '经济与财富',
    query: {
      current: '(经济形势 OR 货币政策 OR 资本流向 OR 股市 OR 基金 OR 投资者教育 OR 理财 OR 商业) (site:pbc.gov.cn OR site:stats.gov.cn OR site:csrc.gov.cn OR site:cssn.cn) when:30d',
      growth: '(经济学 原理 OR 资产配置 OR 基金 投资者教育 OR 商业模式 OR 现金流 OR 财务分析) (site:pbc.gov.cn OR site:csrc.gov.cn OR site:edu.cn OR site:cssn.cn OR site:cf40.org.cn OR site:caixin.com) when:3650d',
    },
    keywords: {
      current: /经济|货币|金融|资本|资金|股市|股票|基金|投资|理财|商业|消费|就业|通胀|GDP|市场/,
      growth: /经济学|资产配置|基金|投资|理财|商业模式|现金流|财务分析|风险管理|货币|金融|资本/,
    },
  },
  {
    id: 'technology',
    label: '科技与 AI',
    query: {
      current: '(科技成果 突破 OR 人工智能 最新进展 OR AI 大模型 OR 生成式人工智能) (site:most.gov.cn OR site:cas.cn OR site:edu.cn) when:30d',
      growth: '(人工智能 原理 OR 大模型 技术 OR 机器学习 方法 OR AI 工程实践 OR 科技产业 分析) (site:cas.cn OR site:edu.cn OR site:infoq.cn OR site:jiqizhixin.com OR site:oschina.net) when:3650d',
    },
    keywords: {
      current: /人工智能|\bAI\b|大模型|芯片|量子|机器人|算法|算力|科技成果|科学发现|科研突破/i,
      growth: /人工智能|\bAI\b|大模型|机器学习|深度学习|算法|模型|工程实践|技术原理|算力|芯片/i,
    },
  },
  {
    id: 'medicine',
    label: '中医药与针灸',
    query: {
      current: '(中医药 研究 OR 针灸 临床 OR 中医药 政策 OR 中药 科研) (site:satcm.gov.cn OR site:edu.cn OR site:cas.cn) when:90d',
      growth: '(中医 基础理论 OR 针灸 原理 OR 中药 学习 OR 中医 临床研究 方法 OR 循证医学) (site:satcm.gov.cn OR site:edu.cn OR site:cas.cn OR site:cnki.net) when:3650d',
    },
    keywords: {
      current: /中医|针灸|中药|穴位|经络|药材/,
      growth: /中医|针灸|中药|穴位|经络|药材|循证|临床研究|证据/,
    },
  },
  {
    id: 'energy',
    label: '电力与能源',
    query: {
      current: '(电网 OR 新型电力系统 OR 电力市场 OR 能源转型 OR 新能源) (site:nea.gov.cn OR site:sgcc.com.cn OR site:ndrc.gov.cn OR site:cas.cn) when:30d',
      growth: '(电力系统 原理 OR 电网 调度 OR 电力市场 机制 OR 储能 技术 OR 能源经济) (site:nea.gov.cn OR site:sgcc.com.cn OR site:edu.cn OR site:cas.cn OR site:cepc.com.cn) when:3650d',
    },
    keywords: {
      current: /电网|电力|能源|新能源|储能|光伏|风电|核电|用电|输电|电价/,
      growth: /电力系统|电网|电力市场|电网调度|储能|新能源|能源经济|输电|配电|电力技术/,
    },
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

const growthBlockedPatterns = [
  /招生|报考|专业介绍|课程表|课程教学质量标准|需要学哪些课程/i,
  /讲习班.*举办|系列活动|宣传月|论坛.*举办/i,
  /周报|日报|早报|快讯|曝.*离职|认输/i,
  /工作动态|校园新闻|学院新闻/i,
  /成果亮相|再添硕果|人才培养|专业建设/i,
  /培养方案|培养计划|培养目标|教学计划/i,
  /附件\s*\d|一览表|指导教师|研究方向/i,
  /专题讲座|作.*讲座|讲座举行/i,
  /训赛|实训|竞赛|激荡.*之美/i,
  /招收.*研究生|研究生.*目录|专业目录|博士研究生|硕士研究生/i,
  /产业学院/i,
];

const blockedSources = /抖音|快手|小红书|哔哩哔哩|Bilibili|情感语录|励志语录/i;
const blockedSourceUrls = /(?:^|\/\/)(?:opac|lib|library)\./i;

const headers = {
  'User-Agent': 'WorkBench-Desktop/0.1',
  Accept: 'application/rss+xml,application/xml,text/xml,*/*;q=0.6',
};

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

function getTagAttribute(block: string, name: string, attribute: string) {
  const match = block.match(
    new RegExp(`<${name}\\b[^>]*\\b${attribute}=(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  return match ? decodeXml(match[1] ?? match[2] ?? '').trim() : '';
}

function isAllowedSource(sourceUrl: string, query: string) {
  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase();
    const domains = [...query.matchAll(/site:([a-z0-9.-]+)/gi)].map((match) => match[1].toLowerCase());
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function googleNewsUrl(query: string) {
  const url = new URL('https://news.google.com/rss/search');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'zh-CN');
  url.searchParams.set('gl', 'CN');
  url.searchParams.set('ceid', 'CN:zh-Hans');
  return url.toString();
}

async function fetchBoard(board: CognitionBoard, mode: CognitionMode) {
  const query = board.query[mode];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await net.fetch(googleNewsUrl(query), { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
    return blocks
      .map((block, index) => {
        const source = getTag(block, 'source');
        const sourceUrl = getTagAttribute(block, 'source', 'url');
        const title = getTag(block, 'title').replace(new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '');
        const url = getTag(block, 'link');
        const summary = getTag(block, 'description');
        const publishedAt = getTag(block, 'pubDate');
        return {
          id: `${mode}-${board.id}-${index}-${url || title}`,
          title,
          url,
          summary: summary.slice(0, 320),
          source,
          sourceUrl,
          publishedAt,
          category: board.id,
          categoryLabel: board.label,
        };
      })
      .filter((item) => {
        const searchable = `${item.title} ${item.summary}`;
        return (
          item.title &&
          item.title.length >= 8 &&
          item.url &&
          isAllowedSource(item.sourceUrl, query) &&
          board.keywords[mode].test(item.title) &&
          !blockedPatterns.some((pattern) => pattern.test(searchable)) &&
          (mode !== 'growth' || !growthBlockedPatterns.some((pattern) => pattern.test(searchable))) &&
          !blockedSources.test(item.source) &&
          !blockedSourceUrls.test(item.sourceUrl)
        );
      })
      .slice(0, 12);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCognitionContent(
  category: CognitionCategoryId = 'digest',
  mode: CognitionMode = 'current',
) {
  const selectedBoards = category === 'digest' ? boards : boards.filter((board) => board.id === category);
  const results = await Promise.allSettled(selectedBoards.map((board) => fetchBoard(board, mode)));
  const perBoardLimit = category === 'digest' ? 2 : 12;
  const items = results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value.slice(0, perBoardLimit) : []))
    .filter((item, index, array) => array.findIndex((candidate) => candidate.url === item.url || candidate.title === item.title) === index)
    .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
    .slice(0, category === 'digest' ? 14 : 12);

  if (!items.length) throw new Error('当前板块暂时没有获取到合适内容，请稍后重试。');
  return {
    items,
    fetchedAt: new Date().toISOString(),
    category,
    mode,
  };
}
