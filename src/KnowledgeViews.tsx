import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, GitFork, RefreshCw, Star } from 'lucide-react';
import './knowledge.css';
import { readStoredJson, writeStoredJson, STORAGE_KEYS } from './storage';

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

function desktopApi() {
  return window.desktop;
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

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function GitHubRankingView() {
  const [category, setCategory] = useState<'projects' | 'skills'>('projects');
  const [period, setPeriod] = useState<'all' | 'week'>('week');
  const cacheKey = useMemo(() => STORAGE_KEYS.githubRanking(category, period), [category, period]);
  const cached = readStoredJson<RankingResponse>(cacheKey);
  const [repositories, setRepositories] = useState<Repository[]>(cached?.repositories ?? []);
  const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt ?? '');
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    maxScroll: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const scrollAnimationRef = useRef<number | null>(null);

  const stopScrollAnimation = useCallback((track?: HTMLDivElement | null) => {
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    track?.classList.remove('is-animating');
  }, []);

  const animateScrollTo = useCallback((track: HTMLDivElement, requestedTarget: number) => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, requestedTarget));
    stopScrollAnimation(track);
    if (Math.abs(target - track.scrollLeft) < 1) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [stopScrollAnimation]);

  const getCardStride = useCallback((track: HTMLDivElement) => {
    const card = track.querySelector<HTMLElement>('.repo-card');
    if (!card) return track.clientWidth * .8;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return card.getBoundingClientRect().width + gap;
  }, []);

  const startInertia = useCallback((track: HTMLDivElement, initialVelocity: number) => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || Math.abs(initialVelocity) < 28) {
      return;
    }

    stopScrollAnimation(track);
    track.classList.add('is-animating');
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    let position = track.scrollLeft;
    let velocity = initialVelocity;
    let lastTime = performance.now();
    const animate = (now: number) => {
      const deltaTime = Math.min(.032, Math.max(.001, (now - lastTime) / 1000));
      lastTime = now;
      position += velocity * deltaTime;
      if (position <= 0 || position >= maxScroll) {
        position = Math.max(0, Math.min(maxScroll, position));
        velocity *= -.28;
      }
      track.scrollLeft = position;
      velocity *= Math.exp(-5.2 * deltaTime);
      if (Math.abs(velocity) < 18) {
        stopScrollAnimation(track);
        return;
      }
      scrollAnimationRef.current = window.requestAnimationFrame(animate);
    };
    scrollAnimationRef.current = window.requestAnimationFrame(animate);
  }, [stopScrollAnimation]);

  const handleCarouselPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const track = event.currentTarget;
    stopScrollAnimation(track);
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      maxScroll: Math.max(0, track.scrollWidth - track.clientWidth),
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
      moved: false,
    };
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    event.preventDefault();
  }, [stopScrollAnimation]);

  const handleCarouselPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    const elapsed = Math.max(1, now - drag.lastTime);
    const instantVelocity = -((event.clientX - drag.lastX) / elapsed) * 1000;
    drag.velocity = drag.velocity * .78 + instantVelocity * .22;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    event.currentTarget.scrollLeft = Math.max(0, Math.min(drag.maxScroll, drag.startScrollLeft - delta));
  }, []);

  const handleCarouselPointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.classList.remove('is-dragging');
    dragRef.current = null;
    if (drag.moved) startInertia(event.currentTarget, drag.velocity);
    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }, [startInertia]);

  const handleCarouselClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  const scrollCarousel = useCallback((direction: -1 | 1) => {
    const track = carouselRef.current;
    if (!track) return;
    const stride = getCardStride(track);
    const currentIndex = Math.floor(track.scrollLeft / stride + .5);
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, (currentIndex + direction) * stride));
    animateScrollTo(track, target);
  }, [animateScrollTo, getCardStride]);

  useEffect(() => () => stopScrollAnimation(carouselRef.current), [stopScrollAnimation]);
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
      writeStoredJson(cacheKey, response);
      setRepositories(response.repositories);
      setFetchedAt(response.fetchedAt);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'GitHub 榜单获取失败。');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, category, period]);

  useEffect(() => {
    const nextCache = readStoredJson<RankingResponse>(cacheKey);
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

      <section className="repo-list repo-carousel" aria-label="GitHub ranking">
        {repositories.length > 1 && (
          <button type="button" className="repo-carousel-control previous" aria-label="Previous GitHub item" onClick={() => scrollCarousel(-1)}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div
          className="repo-carousel-track"
          ref={carouselRef}
          tabIndex={0}
          onPointerDown={handleCarouselPointerDown}
          onPointerMove={handleCarouselPointerMove}
          onPointerUp={handleCarouselPointerEnd}
          onPointerCancel={handleCarouselPointerEnd}
          onClickCapture={handleCarouselClick}
        >
          {repositories.map((repo, index) => (
            <article className={`repo-row repo-card rank-${index + 1}`} key={repo.id}>
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
        </div>
        {repositories.length > 1 && (
          <button type="button" className="repo-carousel-control next" aria-label="Next GitHub item" onClick={() => scrollCarousel(1)}>
            <ChevronRight size={18} />
          </button>
        )}
        {!repositories.length && (
          <div className="ranking-empty">{loading ? '正在连接 GitHub，整理榜单…' : '当前筛选条件下暂无仓库。'}</div>
        )}
      </section>
    </div>
  );
}
