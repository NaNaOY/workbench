import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, GitFork, RefreshCw, Star } from 'lucide-react';
import './knowledge.css';

interface DailyItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
}

interface DailyResponse {
  items: DailyItem[];
  fetchedAt: string;
}

interface Repository {
  id: number;
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
  avatar: string;
  updatedAt: string;
  topics: string[];
}

interface RankingResponse {
  repositories: Repository[];
  fetchedAt: string;
  scope: string;
}

interface DesktopContentApi {
  getDailyContent: () => Promise<DailyResponse>;
  getGitHubRanking: (request: { category: 'projects' | 'skills'; period: 'all' | 'week' }) => Promise<RankingResponse>;
  openExternal: (url: string) => Promise<boolean>;
  notify: (title: string, body: string) => void;
}

interface CachedDaily extends DailyResponse {
  date: string;
}

const dailyCacheKey = 'workbench:daily-content:v1';
const reflectionKey = `workbench:reflection:${localDateKey()}`;
const questions = [
  '今天有什么观点，是你一直默认正确、却从未认真验证过的？',
  '如果把当前最重要的问题重新定义一次，会得到什么不同答案？',
  '最近哪条信息改变了你的判断？改变发生在什么地方？',
  '今天做的事情里，哪些是重要但不紧急的长期积累？',
  '如果只能保留一个行动来推进目标，你会保留哪一个？',
  '你是否把别人的结论误当成了自己的思考？',
  '本周有什么判断可以通过一个小实验快速验证？',
];

function desktopApi() {
  return window.desktop as typeof window.desktop & DesktopContentApi | undefined;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isAfterEight(date = new Date()) {
  return date.getHours() >= 8;
}

function millisecondsUntilNextEight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '最近更新';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
}

function formatUpdateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '尚未更新';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function openLink(url: string) {
  const api = desktopApi();
  if (api?.openExternal) {
    void api.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function DailyGrowthView() {
  const cached = readJson<CachedDaily>(dailyCacheKey);
  const [items, setItems] = useState<DailyItem[]>(cached?.items ?? []);
  const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt ?? '');
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const [reflection, setReflection] = useState(() => localStorage.getItem(reflectionKey) ?? '');
  const question = questions[Math.floor(Date.now() / 86_400_000) % questions.length];

  const refresh = useCallback(async (showLoading = true) => {
    const api = desktopApi();
    if (!api?.getDailyContent) {
      setError('当前环境不支持联网更新，请使用桌面版启动。');
      return null;
    }
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await api.getDailyContent();
      const cache: CachedDaily = { ...response, date: localDateKey() };
      localStorage.setItem(dailyCacheKey, JSON.stringify(cache));
      setItems(response.items);
      setFetchedAt(response.fetchedAt);
      return response;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '内容更新失败，请稍后重试。');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentCache = readJson<CachedDaily>(dailyCacheKey);
    if (!currentCache || (isAfterEight() && currentCache.date !== localDateKey())) {
      void refresh(!currentCache);
    } else {
      setLoading(false);
    }

    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(async () => {
        await refresh(false);
        schedule();
      }, millisecondsUntilNextEight());
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const featured = items[0];
  const remaining = items.slice(1, 7);

  return (
    <div className="knowledge-page">
      <section className="knowledge-heading">
        <div>
          <span className="knowledge-kicker">每日认知</span>
          <h2>每天用十分钟，更新一次自己的思维模型。</h2>
          <p>精选中文深度内容，在输入之后留下一个属于你的判断。</p>
        </div>
        <div className="update-box">
          <span><i /> 每日 08:00 自动更新</span>
          <small>{fetchedAt ? `上次更新：${formatUpdateTime(fetchedAt)}` : '等待首次更新'}</small>
          <button type="button" onClick={() => void refresh()} disabled={loading}>{loading ? '正在更新…' : '立即更新'}</button>
        </div>
      </section>

      {error && <div className="content-alert">暂时无法联网更新，已保留上次内容。{error}</div>}

      <section className="cognition-grid">
        <article className="thinking-card">
          <span className="card-label">今日问题</span>
          <strong>{question}</strong>
          <textarea
            value={reflection}
            onChange={(event) => {
              setReflection(event.target.value);
              localStorage.setItem(reflectionKey, event.target.value);
            }}
            placeholder="写下此刻的想法，不必追求完整…"
          />
          <small>内容自动保存在本机</small>
        </article>

        {featured ? (
          <article className="featured-reading">
            <div className="reading-meta"><span>{featured.source}</span><small>{formatDate(featured.publishedAt)}</small></div>
            <h3>{featured.title}</h3>
            <p>{featured.summary || '点击阅读原文，了解完整内容。'}</p>
            <button type="button" onClick={() => openLink(featured.url)}>阅读今日精选 <span>→</span></button>
          </article>
        ) : (
          <article className="featured-reading loading-reading">
            <div className="reading-placeholder" />
            <div className="reading-placeholder short" />
            <p>{loading ? '正在从中文内容源获取今日精选…' : '暂时没有可展示的内容。'}</p>
          </article>
        )}
      </section>

      <section className="reading-section">
        <div className="section-title-row">
          <div><span className="knowledge-kicker">今日延伸阅读</span><h2>值得多想一步</h2></div>
          <span className="source-note">来源：科技爱好者周刊 · 少数派</span>
        </div>
        <div className="reading-list">
          {remaining.map((item, index) => (
            <button type="button" className="reading-row" key={item.id} onClick={() => openLink(item.url)}>
              <span className="reading-index">{String(index + 2).padStart(2, '0')}</span>
              <span className="reading-copy"><strong>{item.title}</strong><small>{item.source} · {formatDate(item.publishedAt)}</small></span>
              <span className="reading-arrow"><ExternalLink size={14} /></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function GitHubRankingView() {
  const [category, setCategory] = useState<'projects' | 'skills'>('projects');
  const [period, setPeriod] = useState<'all' | 'week'>('week');
  const cacheKey = useMemo(() => `workbench:github:${category}:${period}:v1`, [category, period]);
  const cached = readJson<RankingResponse>(cacheKey);
  const [repositories, setRepositories] = useState<Repository[]>(cached?.repositories ?? []);
  const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt ?? '');
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const api = desktopApi();
    if (!api?.getGitHubRanking) {
      setError('当前环境不支持 GitHub 榜单，请使用桌面版启动。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.getGitHubRanking({ category, period });
      localStorage.setItem(cacheKey, JSON.stringify(response));
      setRepositories(response.repositories);
      setFetchedAt(response.fetchedAt);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'GitHub 榜单获取失败。');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, category, period]);

  useEffect(() => {
    const nextCache = readJson<RankingResponse>(cacheKey);
    if (nextCache) {
      setRepositories(nextCache.repositories);
      setFetchedAt(nextCache.fetchedAt);
      setLoading(false);
    } else {
      setRepositories([]);
      void refresh();
    }
  }, [cacheKey, refresh]);

  return (
    <div className="knowledge-page">
      <section className="github-heading">
        <div>
          <span className="knowledge-kicker">GitHub 干货榜单</span>
          <h2>发现值得学习、收藏和动手尝试的开源成果。</h2>
          <p>仓库名称和介绍保留原文；总榜按 Star 排序，周榜统计近 7 天新建仓库。</p>
        </div>
        <button type="button" className="ranking-refresh" onClick={() => void refresh()} disabled={loading}><RefreshCw size={13} />{loading ? '获取中…' : '刷新榜单'}</button>
      </section>

      <div className="ranking-toolbar">
        <div className="ranking-tabs">
          <button type="button" className={category === 'projects' ? 'active' : ''} onClick={() => setCategory('projects')}>开源项目</button>
          <button type="button" className={category === 'skills' ? 'active' : ''} onClick={() => setCategory('skills')}>Agent Skills</button>
        </div>
        <div className="ranking-tabs compact">
          <button type="button" className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>总榜</button>
          <button type="button" className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>周榜</button>
        </div>
        <span className="ranking-updated">{fetchedAt ? `更新于 ${formatUpdateTime(fetchedAt)}` : '等待更新'}</span>
      </div>

      {error && <div className="content-alert">已保留上次榜单。{error}</div>}

      <section className="repo-list">
        {repositories.map((repo, index) => (
          <article className={`repo-row rank-${index + 1}`} key={repo.id}>
            <div className="rank-number">{String(index + 1).padStart(2, '0')}</div>
            <img src={repo.avatar} alt="" />
            <div className="repo-copy">
              <div className="repo-name-line"><h3>{repo.name}</h3>{repo.language && <span>{repo.language}</span>}</div>
              <p>{repo.description}</p>
              <div className="repo-topics">{repo.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}</div>
            </div>
            <div className="repo-stats">
              <strong><Star size={13} /> {formatCount(repo.stars)}</strong>
              <span><GitFork size={13} /> {formatCount(repo.forks)}</span>
              <button type="button" onClick={() => openLink(repo.url)}>在 GitHub 查看 <ExternalLink size={13} /></button>
            </div>
          </article>
        ))}
        {!repositories.length && (
          <div className="ranking-empty">{loading ? '正在连接 GitHub，整理榜单…' : '当前筛选条件下暂无仓库。'}</div>
        )}
      </section>
    </div>
  );
}
