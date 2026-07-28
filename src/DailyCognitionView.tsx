import { useCallback, useEffect, useMemo, useState } from 'react';
import './cognition.css';

type CategoryId = 'digest' | 'politics' | 'thinking' | 'psychology' | 'law' | 'economy' | 'technology' | 'medicine' | 'energy';
type CognitionMode = 'current' | 'growth';

interface Board {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
  growthDescription: string;
  topics: string[];
  question: string;
  growthQuestion: string;
}

interface CognitionItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: CategoryId;
  categoryLabel: string;
}

interface CognitionResponse {
  items: CognitionItem[];
  fetchedAt: string;
  category: CategoryId;
  mode: CognitionMode;
}

interface DesktopCognitionApi {
  getDailyContent: (category?: CategoryId, mode?: CognitionMode, force?: boolean) => Promise<CognitionResponse>;
  openExternal: (url: string) => Promise<boolean>;
}

const modules: Array<{
  id: CognitionMode;
  icon: string;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: 'current',
    icon: '时',
    label: '每日时政',
    eyebrow: '看清今天',
    description: '政策风向、国际格局、经济变化与科技动态',
  },
  {
    id: 'growth',
    icon: '知',
    label: '认知提升',
    eyebrow: '积累长期能力',
    description: '原理、方法、行业知识与可迁移的专业技能',
  },
];

const boards: Board[] = [
  {
    id: 'digest',
    label: '综合总览',
    icon: '◈',
    description: '跨领域选取今天值得关注的变化',
    growthDescription: '跨领域选取值得长期学习的知识文章',
    topics: ['政策', '思维', '法律', '经济', '科技', '健康'],
    question: '今天哪条信息最可能改变你未来三个月的判断？为什么？',
    growthQuestion: '这篇文章提供了什么可迁移的方法？你能把它用到哪个真实问题上？',
  },
  {
    id: 'politics',
    label: '政治与格局',
    icon: '衡',
    description: '看政策、治理与国际变化，不追逐情绪',
    growthDescription: '理解制度、治理、国际关系与政治分析框架',
    topics: ['政治风向', '政治思维', '国家治理', '国际发展格局', '新闻'],
    question: '这项政策要解决的真实约束是什么？谁会因此改变行为？',
    growthQuestion: '作者使用了哪些制度、利益与权力关系解释现实？',
  },
  {
    id: 'thinking',
    label: '思维与经典',
    icon: '思',
    description: '用经典与系统思维校正判断框架',
    growthDescription: '学习经典、决策方法与系统化思考能力',
    topics: ['五维思维', '毛选', '资本论', '道德经', '资治通鉴', '史记'],
    question: '如果分别从时间、利益、制度、关系和风险五个维度看，结论有什么变化？',
    growthQuestion: '这套思维方法的适用条件、边界和反例分别是什么？',
  },
  {
    id: 'psychology',
    label: '心理与人际',
    icon: '心',
    description: '理解当下行为、边界与真实的人际互动',
    growthDescription: '掌握心理机制、沟通方法与关系边界',
    topics: ['心理学', '提高情商', '识别人心', '提防恶意', '人际关系'],
    question: '眼前这个人的表达、利益和实际行动是否一致？',
    growthQuestion: '这项心理机制如何体现在日常沟通中？哪些信号可以观察和验证？',
  },
  {
    id: 'law',
    label: '法律与民法',
    icon: '法',
    description: '关注规则变化、权利责任与典型案件',
    growthDescription: '建立合同、证据、程序与权利边界意识',
    topics: ['民法常识', '合同', '侵权', '劳动权益', '典型案例'],
    question: '如果发生争议，权利依据、证据和责任边界分别是什么？',
    growthQuestion: '这个法律知识在真实生活中对应什么风险？应提前保留哪些证据？',
  },
  {
    id: 'economy',
    label: '经济与财富',
    icon: '财',
    description: '观察经济走向、资金流动与市场信号',
    growthDescription: '学习经济原理、资产配置、财务与商业分析',
    topics: ['经济学', '股市', '基金管理', '理财投资', '商业思维', '钱往哪流'],
    question: '资金正在从哪里流出、流向哪里？背后的收益与风险由谁承担？',
    growthQuestion: '这套分析如何区分收益来源、风险敞口、现金流和估值变化？',
  },
  {
    id: 'technology',
    label: '科技与 AI',
    icon: '智',
    description: '关注真正的科研突破与生产力变化',
    growthDescription: '理解技术原理、工程方法、产业应用与职业能力',
    topics: ['科技成果突破', 'AI 最新动态', 'AI 大模型', 'AI 替代什么', 'AI 创造什么'],
    question: '这项技术真正降低了什么成本，又创造了什么新能力？',
    growthQuestion: '这项技术的输入、核心机制、输出和工程限制分别是什么？',
  },
  {
    id: 'medicine',
    label: '中医药与针灸',
    icon: '医',
    description: '关注政策、科研与临床证据，不替代诊断',
    growthDescription: '学习基础理论、研究方法、证据等级与适用边界',
    topics: ['中医药', '针灸', '中药科研', '临床证据', '健康政策'],
    question: '这项健康结论来自什么证据，适用人群和限制条件是什么？',
    growthQuestion: '文章使用了什么证据？样本、对照、适用人群和风险提示是否完整？',
  },
  {
    id: 'energy',
    label: '电力与能源',
    icon: '电',
    description: '观察电网、能源转型与产业基础设施变化',
    growthDescription: '学习电力系统、市场机制、储能技术与能源经济',
    topics: ['电网', '新型电力系统', '电力市场', '新能源', '能源安全'],
    question: '这项变化会如何影响供给稳定性、成本与产业链？',
    growthQuestion: '这个系统如何在安全、成本、效率和波动性之间取得平衡？',
  },
];

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function api() {
  return window.desktop as typeof window.desktop & DesktopCognitionApi | undefined;
}

function readCache(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CognitionResponse & { date: string }) : null;
  } catch {
    return null;
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '最近更新';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatArticleDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '近期';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function openArticle(url: string) {
  const desktop = api();
  if (desktop?.openExternal) void desktop.openExternal(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

export default function DailyCognitionView() {
  const [mode, setMode] = useState<CognitionMode>('current');
  const [category, setCategory] = useState<CategoryId>('digest');
  const board = useMemo(() => boards.find((item) => item.id === category) ?? boards[0], [category]);
  const activeModule = modules.find((item) => item.id === mode) ?? modules[0];
  const cacheKey = `workbench:cognition:${mode}:${category}:v3`;
  const initialCache = readCache(cacheKey);
  const [items, setItems] = useState<CognitionItem[]>(initialCache?.items ?? []);
  const [fetchedAt, setFetchedAt] = useState(initialCache?.fetchedAt ?? '');
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState('');
  const reflectionKey = `workbench:cognition-reflection:${mode}:${category}:${dateKey()}`;
  const [reflection, setReflection] = useState(() => localStorage.getItem(reflectionKey) ?? '');

  const refresh = useCallback(async () => {
    const desktop = api();
    if (!desktop?.getDailyContent) {
      setError('当前环境无法联网，请通过桌面快捷方式启动。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await desktop.getDailyContent(category, mode, true);
      localStorage.setItem(cacheKey, JSON.stringify({ ...response, date: dateKey() }));
      setItems(response.items);
      setFetchedAt(response.fetchedAt);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '内容获取失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, category, mode]);

  useEffect(() => {
    const cached = readCache(cacheKey);
    if (cached) {
      setItems(cached.items);
      setFetchedAt(cached.fetchedAt);
      setLoading(false);
    } else {
      setItems([]);
      setFetchedAt('');
      void refresh();
    }
    setReflection(localStorage.getItem(reflectionKey) ?? '');
  }, [cacheKey, reflectionKey, refresh]);

  const featured = items[0];
  const boardDescription = mode === 'growth' ? board.growthDescription : board.description;
  const thinkingQuestion = mode === 'growth' ? board.growthQuestion : board.question;
  const feedLabel = mode === 'growth' ? '知识文章' : '可信时政';

  return (
    <div className={`cognition-page cognition-page--${mode}`}>
      <section className="cognition-header">
        <div>
          <span className="cognition-kicker">每日认知 · {activeModule.label}</span>
          <h2>{mode === 'growth' ? '把信息沉淀成知识、方法与专业能力。' : '理解今天正在发生什么，以及它为什么发生。'}</h2>
          <p>
            {mode === 'growth'
              ? '优先选择课程讲义、研究文章、专业解读和行业方法论；适当扩大来源，但继续过滤鸡汤、情绪文案和空洞观点。'
              : '聚焦政策、法律、经济、科技与国际变化；优先权威机构和可信来源，不追逐情绪。'}
          </p>
        </div>
        <div className="cognition-status">
          <span><i /> 每日 08:00 自动更新</span>
          <small>{fetchedAt ? `本板块更新于 ${formatTime(fetchedAt)}` : '等待首次更新'}</small>
          <button type="button" onClick={() => void refresh()} disabled={loading}>{loading ? '正在获取…' : '更新本板块'}</button>
        </div>
      </section>

      <nav className="cognition-mode-switch" aria-label="每日认知内容模块">
        {modules.map((item) => (
          <button
            type="button"
            key={item.id}
            className={mode === item.id ? 'active' : ''}
            onClick={() => {
              setMode(item.id);
              setCategory('digest');
            }}
          >
            <span>{item.icon}</span>
            <div><small>{item.eyebrow}</small><strong>{item.label}</strong><p>{item.description}</p></div>
            <b aria-hidden="true">进入 →</b>
          </button>
        ))}
      </nav>

      <nav className="board-nav" aria-label={`${activeModule.label}分类`}>
        {boards.map((item) => (
          <button type="button" key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>
            <span>{item.icon}</span>
            <strong>{item.id === 'digest' ? (mode === 'growth' ? '知识总览' : '今日总览') : item.label}</strong>
            <small>{mode === 'growth' ? item.growthDescription : item.description}</small>
          </button>
        ))}
      </nav>

      <section className="board-intro">
        <div>
          <span className="board-symbol">{board.icon}</span>
          <div>
            <span className="cognition-kicker">{activeModule.label} · 当前分类</span>
            <h2>{board.id === 'digest' ? (mode === 'growth' ? '知识总览' : '今日总览') : board.label}</h2>
            <p>{boardDescription}</p>
          </div>
        </div>
        <div className="topic-cloud">{board.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
      </section>

      {error && <div className="cognition-alert">联网更新暂时失败，已保留上一次内容。{error}</div>}

      <section className="cognition-feature-grid">
        <article className="cognition-feature">
          {featured ? (
            <>
              <div className="article-meta"><span>{featured.categoryLabel}</span><small>{featured.source} · {formatArticleDate(featured.publishedAt)}</small></div>
              <h3>{featured.title}</h3>
              <p>{featured.summary || '阅读原文，了解完整论据、背景、方法和适用边界。'}</p>
              <button type="button" onClick={() => openArticle(featured.url)}>{mode === 'growth' ? '开始深度阅读' : '阅读可信原文'} <span>↗</span></button>
            </>
          ) : (
            <div className="cognition-loading">{loading ? `正在筛选${activeModule.label}内容…` : '当前分类暂时没有内容。'}</div>
          )}
        </article>

        <article className="cognition-question">
          <span className="cognition-kicker">{mode === 'growth' ? '学习迁移卡' : '今日判断框架'}</span>
          <strong>{thinkingQuestion}</strong>
          <textarea
            value={reflection}
            onChange={(event) => {
              setReflection(event.target.value);
              localStorage.setItem(reflectionKey, event.target.value);
            }}
            placeholder={mode === 'growth' ? '写下核心概念、适用场景和你准备练习的方法…' : '写下事实、判断依据和仍不确定的部分…'}
          />
          <small>{mode === 'growth' ? '理解之后再复述，复述之后再应用。' : '只记录推理，不要求积极，也不制造焦虑。'}</small>
        </article>
      </section>

      <section className="cognition-feed">
        <div className="cognition-feed-head">
          <div><span className="cognition-kicker">{feedLabel}</span><h2>{board.id === 'digest' ? activeModule.label : board.label} · {mode === 'growth' ? '知识阅读' : '今日阅读'}</h2></div>
          <span>{mode === 'growth' ? '专业来源 · 内容性优先 · 去空洞观点' : '权威来源 · 时效性优先 · 去情绪化标题'}</span>
        </div>
        <div className="cognition-feed-list">
          {items.slice(1).map((item, index) => (
            <button type="button" key={item.id} className="cognition-feed-row" onClick={() => openArticle(item.url)}>
              <span className="feed-rank">{String(index + 2).padStart(2, '0')}</span>
              <span className="feed-category">{item.categoryLabel}</span>
              <span className="feed-copy"><strong>{item.title}</strong><small>{item.source} · {formatArticleDate(item.publishedAt)}</small></span>
              <span className="feed-open">↗</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
