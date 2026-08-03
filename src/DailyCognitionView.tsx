import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink } from 'lucide-react';
import './cognition.css';

type CategoryId = 'digest' | 'politics' | 'thinking' | 'psychology' | 'law' | 'economy' | 'business' | 'technology' | 'medicine' | 'energy';
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

interface ReflectionEntry {
  id: string;
  mode: CognitionMode;
  category: CategoryId;
  categoryLabel: string;
  question: string;
  content: string;
  createdAt: string;
  relatedItemId?: string;
  relatedTitle?: string;
  relatedUrl?: string;
  relatedSource?: string;
}

const reflectionHistoryKey = 'workbench:cognition-outputs:v1';

interface DesktopCognitionApi {
  getDailyContent: (category?: CategoryId, mode?: CognitionMode, force?: boolean) => Promise<CognitionResponse>;
  onDailyUpdated?: (listener: () => void) => () => void;
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
    icon: '讯',
    label: '每日资讯',
    eyebrow: '紧跟国内热点',
    description: '国内热点、行业变化、经济脉搏与科技动态',
  },
  {
    id: 'growth',
    icon: '学',
    label: '认知提升',
    eyebrow: '每天学会一件事',
    description: '书籍思想、科普知识、实用模型与可迁移方法',
  },
];

const boards: Board[] = [
  {
    id: 'digest',
    label: '综合总览',
    icon: '◈',
    description: '跨领域选取国内今天真正值得关注的热点',
    growthDescription: '跨领域学习一本书的思想、一个模型或一项科普知识',
    topics: ['国内热点', '思维', '法律', '经济', '商业', '科技', '健康'],
    question: '今天哪条信息最可能改变你未来三个月的判断？为什么？',
    growthQuestion: '今天学到的概念能解释哪个真实问题？你准备怎样验证或应用它？',
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
    id: 'business',
    label: '商业思维',
    icon: '商',
    description: '追踪国内企业、行业竞争、消费变化与商业模式热点',
    growthDescription: '学习用户价值、单位经济、现金流、定价与竞争优势',
    topics: ['商业模式', '用户价值', '单位经济', '现金流', '定价', '护城河'],
    question: '这条商业动态改变了谁的成本、渠道、用户价值或竞争位置？',
    growthQuestion: '这个商业模型靠什么创造价值、获取收入并留下现金？',
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

function dailyRefreshBoundary(date = new Date()) {
  const boundary = new Date(date);
  boundary.setHours(8, 0, 0, 0);
  if (date.getTime() < boundary.getTime()) boundary.setDate(boundary.getDate() - 1);
  return boundary;
}

function dailyRefreshBoundaryKey() {
  return dateKey(dailyRefreshBoundary());
}

function cacheNeedsDailyRefresh(cache: CognitionResponse | null) {
  if (!cache) return true;
  const fetchedAt = new Date(cache.fetchedAt).getTime();
  return !Number.isFinite(fetchedAt) || fetchedAt < dailyRefreshBoundary().getTime();
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

function readReflectionHistory() {
  try {
    const raw = localStorage.getItem(reflectionHistoryKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as ReflectionEntry[] : [];
  } catch {
    return [];
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
  const categoryIndex = Math.max(0, boards.findIndex((item) => item.id === category));
  const canGoPrevious = categoryIndex > 0;
  const canGoNext = categoryIndex < boards.length - 1;

  function moveCategory(offset: -1 | 1) {
    const nextIndex = categoryIndex + offset;
    if (nextIndex < 0 || nextIndex >= boards.length) return;
    setCategory(boards[nextIndex].id);
  }
  const cacheKey = `workbench:cognition:${mode}:${category}:v5`;
  const initialCache = readCache(cacheKey);
  const [items, setItems] = useState<CognitionItem[]>(initialCache?.items ?? []);
  const [fetchedAt, setFetchedAt] = useState(initialCache?.fetchedAt ?? '');
  const [loading, setLoading] = useState(() => cacheNeedsDailyRefresh(initialCache));
  const [error, setError] = useState('');
  const reflectionKey = `workbench:cognition-reflection:${mode}:${category}:${dateKey()}`;
  const [reflection, setReflection] = useState(() => localStorage.getItem(reflectionKey) ?? '');
  const [reflectionHistory, setReflectionHistory] = useState<ReflectionEntry[]>(readReflectionHistory);
  const [feedback, setFeedback] = useState('');
  const [relatedItemId, setRelatedItemId] = useState('');
  const [relatedPickerOpen, setRelatedPickerOpen] = useState(false);

  const refresh = useCallback(async (silent = false) => {
    const desktop = api();
    if (!desktop?.getDailyContent) {
      setError('当前环境无法联网，请通过桌面快捷方式启动。');
      return;
    }
    setLoading(true);
    setError('');
    setFeedback('');
    try {
      const response = await desktop.getDailyContent(category, mode, true);
      localStorage.setItem(cacheKey, JSON.stringify({ ...response, date: dateKey() }));
      setItems(response.items);
      setFetchedAt(response.fetchedAt);
      if (!silent) setFeedback('已更新本板块');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '内容获取失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, category, mode]);

  useEffect(() => {
    const cached = readCache(cacheKey);
    if (cached && !cacheNeedsDailyRefresh(cached)) {
      setItems(cached.items);
      setFetchedAt(cached.fetchedAt);
      setLoading(false);
    } else {
      setItems(cached?.items ?? []);
      setFetchedAt(cached?.fetchedAt ?? '');
      setLoading(true);
      void refresh(true);
    }
    setReflection(localStorage.getItem(reflectionKey) ?? '');
    setFeedback('');
  }, [cacheKey, reflectionKey, refresh]);

  useEffect(() => {
    const desktop = api();
    let boundaryKey = dailyRefreshBoundaryKey();
    const refreshAtBoundary = () => {
      const nextBoundaryKey = dailyRefreshBoundaryKey();
      if (nextBoundaryKey === boundaryKey) return;
      boundaryKey = nextBoundaryKey;
      void refresh(true);
    };
    const unsubscribe = desktop?.onDailyUpdated?.(refreshAtBoundary);
    const timer = window.setInterval(refreshAtBoundary, 30_000);
    return () => {
      unsubscribe?.();
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    setRelatedItemId((current) => (
      items.some((item) => item.id === current) ? current : items[0]?.id ?? ''
    ));
    setRelatedPickerOpen(false);
  }, [items, mode, category]);

  const featured = items[0];
  const thinkingQuestion = mode === 'growth' ? board.growthQuestion : board.question;
  const feedLabel = mode === 'growth' ? '知识卡片' : '国内热点';
  const feedItems = items.slice(1, 6);
  const relatedItems = items.slice(0, 6);
  const relatedItem = relatedItems.find((item) => item.id === relatedItemId) ?? featured;

  function saveReflection() {
    const content = reflection.trim();
    if (!content) {
      setFeedback('请先写下你的思考或学习收获');
      return;
    }
    const entry: ReflectionEntry = {
      id: crypto.randomUUID(),
      mode,
      category,
      categoryLabel: category === 'digest' ? (mode === 'growth' ? '今日学习' : '今日资讯') : board.label,
      question: thinkingQuestion,
      content,
      createdAt: new Date().toISOString(),
      relatedItemId: relatedItem?.id,
      relatedTitle: relatedItem?.title,
      relatedUrl: relatedItem?.url,
      relatedSource: relatedItem?.source,
    };
    const next = [entry, ...reflectionHistory].slice(0, 100);
    localStorage.setItem(reflectionHistoryKey, JSON.stringify(next));
    setReflectionHistory(next);
    setFeedback('已保存到“我的认知产出”');
  }

  function deleteReflection(id: string) {
    const next = reflectionHistory.filter((entry) => entry.id !== id);
    localStorage.setItem(reflectionHistoryKey, JSON.stringify(next));
    setReflectionHistory(next);
    setFeedback('已删除这条认知产出');
  }

  async function copyReflection(entry: ReflectionEntry) {
    try {
      await navigator.clipboard.writeText(
        `${entry.categoryLabel}\n关联内容：${entry.relatedTitle ?? '未关联'}\n\n${entry.question}\n\n${entry.content}`,
      );
      setFeedback('认知产出已复制');
    } catch {
      setFeedback('复制失败，请手动选择文字');
    }
  }

  return (
    <div className={`cognition-page cognition-page--${mode}`}>
      <section className="cognition-header">
        <div>
          <h2>{mode === 'growth' ? '每天真正学会一个概念、模型或方法。' : '掌握国内正在发生的热点，以及它为何值得关注。'}</h2>
          <p>
            {mode === 'growth'
              ? '内容来自书籍核心思想与严谨科普，由工作台重组为“核心概念、适用场景、自测问题”；不混入公告、快讯和情绪文案。'
              : '聚焦国内社会、法律、经济、商业、科技与行业变化；扩大可信媒体范围，优先时效、事实和现实影响。'}
          </p>
        </div>
        <div className="cognition-status">
          <span><i /> 每日 08:00 自动更新</span>
          <small>{fetchedAt ? `本板块更新于 ${formatTime(fetchedAt)}` : '等待首次更新'}</small>
          {feedback && <em>{feedback}</em>}
          <button type="button" onClick={() => void refresh()} disabled={loading}>{loading ? '正在更新…' : '更新本板块'}</button>
        </div>
      </section>

      <nav className="cognition-module-tabs cognition-module-tabs--standalone" aria-label="每日认知内容模块">
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
                <strong>{item.label}</strong>
              </button>
            ))}
      </nav>

      <section className="cognition-control-panel">
        <nav className="cognition-category-strip" aria-label={`${activeModule.label}分类`}>
          {boards.map((item) => (
            <button
              type="button"
              key={item.id}
              className={category === item.id ? 'active' : ''}
              onClick={() => setCategory(item.id)}
            >
              <span>{item.icon}</span>
              {item.id === 'digest' ? (mode === 'growth' ? '今日学习' : '今日资讯') : item.label}
            </button>
          ))}
        </nav>
      </section>



      {error && <div className="cognition-alert">联网更新暂时失败，已保留上一次内容。{error}</div>}



      <section className="cognition-feature-grid">
        <div className="cognition-board-pager cognition-board-pager--sides" aria-label="切换内容板块">
          <button
            type="button"
            className="cognition-board-pager-button"
            aria-label="上一个板块"
            title="上一个板块"
            onClick={() => moveCategory(-1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>上一个板块</span>
          </button>
          <button
            type="button"
            className="cognition-board-pager-button"
            aria-label="下一个板块"
            title="下一个板块"
            onClick={() => moveCategory(1)}
            disabled={!canGoNext}
          >
            <span>下一个板块</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <article className="cognition-feature">
          {featured ? (
            <>
              <div className="article-meta"><span>{featured.categoryLabel}</span><small>{featured.source} · {formatArticleDate(featured.publishedAt)}</small></div>
              <h3>{featured.title}</h3>
              <p>{featured.summary || '阅读完整内容，理解核心概念、适用场景与方法边界。'}</p>
              <div className="cognition-feature-actions">
                <button type="button" onClick={() => openArticle(featured.url)}>{mode === 'growth' ? '查看知识来源' : '阅读资讯原文'} <ExternalLink size={13} /></button>
              </div>
              <div className="knowledge-drawer open">
                <div>
                  <header><strong>{feedLabel}</strong><small>点击条目阅读来源；写笔记时可在右侧选择关联</small></header>
                  <div className="knowledge-drawer-list">
                    {feedItems.map((item, index) => (
                      <button type="button" key={item.id} onClick={() => openArticle(item.url)}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div><strong>{item.title}</strong><small>{item.source} · {formatArticleDate(item.publishedAt)}</small></div>
                        <b><ExternalLink size={13} /></b>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="cognition-loading">{loading ? `正在筛选${activeModule.label}内容…` : '当前分类暂时没有内容。'}</div>
          )}
        </article>

        <article className="cognition-question">
          <div className="cognition-relation">
            <button
              type="button"
              className="cognition-relation-trigger"
              aria-expanded={relatedPickerOpen}
              disabled={!relatedItem}
              onClick={() => setRelatedPickerOpen((open) => !open)}
            >
              <span>关联知识条目</span>
              <strong>{relatedItem?.title ?? '等待内容加载'}</strong>
              <b>{relatedPickerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</b>
            </button>
            <div className={`cognition-relation-menu ${relatedPickerOpen ? 'open' : ''}`}>
              <div>
                {relatedItems.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={relatedItemId === item.id ? 'active' : ''}
                    onClick={() => {
                      setRelatedItemId(item.id);
                      setRelatedPickerOpen(false);
                    }}
                  >
                    <span>{index === 0 ? '重点' : String(index).padStart(2, '0')}</span>
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <strong>{thinkingQuestion}</strong>
          <textarea
            value={reflection}
            onChange={(event) => {
              setReflection(event.target.value);
              localStorage.setItem(reflectionKey, event.target.value);
            }}
            placeholder={mode === 'growth' ? '写下核心概念、适用场景和你准备练习的方法…' : '写下事实、判断依据和仍不确定的部分…'}
          />
          <div className="cognition-question-actions">
            <small>{mode === 'growth' ? '草稿会自动保留；点击保存后形成一张长期认知卡。' : '草稿会自动保留；点击保存后进入认知产出。'}</small>
            <button type="button" onClick={saveReflection} disabled={!reflection.trim()}>
              {mode === 'growth' ? '保存学习卡' : '保存思考记录'}
            </button>
          </div>
        </article>
        </section>

      <section className="cognition-output">
        <div className="cognition-output-head">
          <div>
            <span className="cognition-kicker">我的认知产出</span>
            <h2>把每天的思考沉淀成自己的知识库</h2>
          </div>
          <span>本地保存 {reflectionHistory.length} 条 · 最多保留 100 条</span>
        </div>
        {reflectionHistory.length ? (
          <div className="cognition-output-list">
            {reflectionHistory.slice(0, 6).map((entry) => (
              <article key={entry.id}>
                <div>
                  <span>{entry.mode === 'growth' ? '学习卡' : '思考记录'} · {entry.categoryLabel}</span>
                  <small>{formatTime(entry.createdAt)}</small>
                </div>
                <strong>{entry.question}</strong>
                {entry.relatedTitle && (
                  <button
                    type="button"
                    className="cognition-output-related"
                    onClick={() => entry.relatedUrl && openArticle(entry.relatedUrl)}
                  >
                    关联：{entry.relatedTitle} {entry.relatedSource ? `· ${entry.relatedSource}` : ''}
                  </button>
                )}
                <p>{entry.content}</p>
                <footer>
                  <button type="button" onClick={() => void copyReflection(entry)}>复制</button>
                  <button type="button" onClick={() => deleteReflection(entry.id)}>删除</button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="cognition-output-empty">填写上方思考练习或学习迁移卡，然后点击保存；你的第一条认知产出会出现在这里。</div>
        )}
      </section>

    </div>
  );
}
