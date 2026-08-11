import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gauge,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppSelect } from './AppSelect';
import { FUTURE_CONTRACTS, FutureContractConfig, FutureContractKey, FutureThreshold, futureContractByKey } from '../futures-config';

interface FuturesQuote {
  key: FutureContractKey;
  price: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  percent: number;
  name: string;
  code: string;
  marketTime: string;
  stale: boolean;
}

interface FuturesTrendPoint {
  time: string;
  price: number;
  average: number | null;
  volume: number;
}

interface FuturesKlinePoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  percent: number;
}

interface FuturesKlineChartPoint extends FuturesKlinePoint {
  range: [number, number];
}

interface FuturesMarketResponse {
  quotes: FuturesQuote[];
  trend: FuturesTrendPoint[];
  dailyK: FuturesKlinePoint[];
  selectedKey: FutureContractKey;
  fetchedAt: string;
  source: string;
  partial: boolean;
  demo?: boolean;
}

interface FuturesCustomAlert {
  id: string;
  contractKey: FutureContractKey;
  direction: 'above' | 'below';
  value: number;
  label: string;
  enabled: boolean;
}

interface DailyHistoryPoint {
  date: string;
  price: number;
}

type DailyHistory = Partial<Record<FutureContractKey, DailyHistoryPoint[]>>;
type ChartRange = 'intraday' | 'daily' | 'history';

const ALERTS_KEY = 'workbench.futures.alerts.v1';
const HISTORY_KEY = 'workbench.futures.history.v1';
const AUTO_KEY = 'workbench.futures.auto-refresh.v1';
const SIX_FLUORO_PRICE_URL = 'https://www.100ppi.com/rawmex/detail-1773.html';

const demoValues: Record<FutureContractKey, [number, number, number, number, number]> = {
  lcm: [144860, 146500, 144200, 146360, 0.36],
  idx: [2341.48, 2345.91, 2291.62, 2309.07, 1.40],
  psm: [36835, 37260, 36140, 36520, 0.82],
  sim: [8625, 8730, 8540, 8610, 0.17],
  sam: [993, 1011, 982, 997, -0.40],
  fgm: [1068, 1080, 1049, 1056, 1.14],
  cum: [80620, 81220, 79880, 80340, 0.35],
};

function fallbackMarket(selectedKey: FutureContractKey): FuturesMarketResponse {
  const now = new Date();
  const quotes = FUTURE_CONTRACTS.map((contract) => {
    const [price, high, low, open, percent] = demoValues[contract.key];
    const previousClose = price / (1 + percent / 100);
    return {
      key: contract.key,
      price,
      high,
      low,
      open,
      previousClose,
      percent,
      name: contract.name,
      code: contract.code,
      marketTime: now.toISOString(),
      stale: false,
    } satisfies FuturesQuote;
  });
  const quote = quotes.find((item) => item.key === selectedKey) ?? quotes[0];
  const trend = Array.from({ length: 36 }, (_, index) => {
    const progress = index / 35;
    const base = quote.open + (quote.price - quote.open) * progress;
    const amplitude = Math.max(quote.price * 0.002, 1);
    return {
      time: `${now.toISOString().slice(0, 10)} ${String(9 + Math.floor(index / 12)).padStart(2, '0')}:${String((index % 12) * 5).padStart(2, '0')}`,
      price: base + Math.sin(index * 0.72) * amplitude,
      average: base,
      volume: 0,
    };
  });
  const dailyK = Array.from({ length: 60 }, (_, index) => {
    const progress = index / 59;
    const center = quote.price * (0.92 + progress * 0.08 + Math.sin(index * 0.31) * 0.012);
    const open = center * (1 + Math.sin(index * 0.77) * 0.004);
    const close = center * (1 + Math.cos(index * 0.63) * 0.004);
    const date = new Date(now);
    date.setDate(date.getDate() - (59 - index));
    return {
      date: date.toISOString().slice(0, 10),
      open,
      close,
      high: Math.max(open, close) * 1.007,
      low: Math.min(open, close) * 0.993,
      volume: 0,
      percent: ((close - open) / open) * 100,
    } satisfies FuturesKlinePoint;
  });
  return {
    quotes,
    trend,
    dailyK,
    selectedKey,
    fetchedAt: now.toISOString(),
    source: '内置演示快照',
    partial: false,
    demo: true,
  };
}

function readAlerts(): FuturesCustomAlert[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const alert = item as Partial<FuturesCustomAlert>;
      const contract = FUTURE_CONTRACTS.find((candidate) => candidate.key === alert.contractKey);
      const value = Number(alert.value);
      if (!alert.id || !contract || !Number.isFinite(value)) return [];
      return [{
        id: String(alert.id),
        contractKey: contract.key,
        direction: alert.direction === 'below' ? 'below' : 'above',
        value,
        label: String(alert.label || '自定义预警'),
        enabled: alert.enabled !== false,
      }];
    });
  } catch {
    return [];
  }
}

function readHistory(): DailyHistory {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}') as DailyHistory;
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function recordDailyHistory(quotes: FuturesQuote[]) {
  const history = readHistory();
  quotes.forEach((quote) => {
    const date = quote.marketTime.slice(0, 10);
    const points = [...(history[quote.key] ?? [])];
    const last = points.at(-1);
    if (last?.date === date) last.price = quote.price;
    else points.push({ date, price: quote.price });
    history[quote.key] = points.slice(-90);
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatCompactPrice(value: number, contract: FutureContractConfig) {
  if (contract.unit.startsWith('元') && value >= 10000) {
    const scaled = value / 10000;
    const digits = value % 10000 === 0 ? 1 : 2;
    return `${scaled.toFixed(digits)} 万`;
  }
  return formatNumber(value, contract.digits);
}

function formatClock(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function thresholdTriggered(threshold: FutureThreshold, price: number) {
  const direction = threshold.direction ?? (threshold.tone === 'positive' ? 'above' : 'below');
  return direction === 'above' ? price >= threshold.value : price <= threshold.value;
}

function signalFor(contract: FutureContractConfig, price: number) {
  if (!price) return { tone: 'neutral', title: '等待行情', detail: '行情载入后自动判断预警状态。' };
  const danger = contract.thresholds.find((threshold) => threshold.tone === 'danger' && thresholdTriggered(threshold, price));
  if (danger) return { tone: 'danger', title: `已触发${danger.label}`, detail: danger.action ?? '执行预设风险纪律。' };
  const warning = contract.thresholds.find((threshold) => threshold.tone === 'warning' && thresholdTriggered(threshold, price));
  if (warning) return { tone: 'warning', title: `已触发${warning.label}`, detail: warning.action ?? '进入预警区，复核风险敞口。' };
  const positive = [...contract.thresholds]
    .filter((threshold) => threshold.tone === 'positive' && thresholdTriggered(threshold, price))
    .sort((left, right) => right.value - left.value)[0];
  if (positive) return { tone: 'positive', title: positive.label, detail: positive.action ?? '价格进入上行确认区。' };
  return { tone: 'steady', title: '当前位于安全区', detail: '尚未触发预设预警线或风险红线。' };
}

function alertTriggered(alert: FuturesCustomAlert, quote?: FuturesQuote) {
  if (!alert.enabled || !quote) return false;
  return alert.direction === 'above' ? quote.price >= alert.value : quote.price <= alert.value;
}

function FuturesTooltip({ active, payload, label, digits }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string; color?: string }>; label?: string; digits: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="futures-chart-tooltip">
      <span>{label?.slice(5)}</span>
      {payload.map((item) => (
        <strong key={item.dataKey} style={{ color: item.color }}>{item.dataKey === 'average' ? '均价' : '价格'} {formatNumber(Number(item.value ?? 0), digits)}</strong>
      ))}
    </div>
  );
}

type FuturesCandleProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: FuturesKlineChartPoint;
};

function FuturesCandle({ x = 0, y = 0, width = 0, height = 0, payload }: FuturesCandleProps) {
  if (!payload || width <= 0 || height < 0) return null;
  const changeUp = payload.close >= payload.open;
  const color = changeUp ? '#c44d5c' : '#388466';
  const span = Math.max(payload.high - payload.low, Number.EPSILON);
  const unit = height / span;
  const openY = y + (payload.high - payload.open) * unit;
  const closeY = y + (payload.high - payload.close) * unit;
  const centerX = x + width / 2;
  const bodyWidth = Math.max(2, Math.min(width * 0.62, 11));
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
  return (
    <g aria-hidden="true">
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={color} strokeWidth={1.1} />
      <rect x={centerX - bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight} rx={1} fill={color} />
    </g>
  );
}

function FuturesKlineTooltip({ active, payload, digits }: { active?: boolean; payload?: Array<{ payload?: FuturesKlineChartPoint }>; digits: number }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="futures-chart-tooltip futures-kline-tooltip">
      <span>{point.date}</span>
      <div><span>开 {formatNumber(point.open, digits)}</span><span>高 {formatNumber(point.high, digits)}</span></div>
      <div><span>收 {formatNumber(point.close, digits)}</span><span>低 {formatNumber(point.low, digits)}</span></div>
      <strong className={point.close >= point.open ? 'up' : 'down'}>{point.percent >= 0 ? '+' : ''}{point.percent.toFixed(2)}%</strong>
    </div>
  );
}

export function FuturesView() {
  const [selectedKey, setSelectedKey] = useState<FutureContractKey>('lcm');
  const [market, setMarket] = useState<FuturesMarketResponse>(() => fallbackMarket('lcm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem(AUTO_KEY) !== 'off');
  const [chartRange, setChartRange] = useState<ChartRange>('intraday');
  const [history, setHistory] = useState<DailyHistory>(() => readHistory());
  const [alerts, setAlerts] = useState<FuturesCustomAlert[]>(() => readAlerts());
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertDraft, setAlertDraft] = useState({ contractKey: 'lcm' as FutureContractKey, direction: 'below' as 'above' | 'below', value: '120000', label: '价格红线提醒' });
  const notifiedAlerts = useRef(new Set<string>());
  const notifiedPresetThresholds = useRef(new Set<string>());

  const quotesByKey = useMemo(() => new Map(market.quotes.map((quote) => [quote.key, quote])), [market.quotes]);
  const contract = futureContractByKey(selectedKey);
  const quote = quotesByKey.get(selectedKey) ?? market.quotes[0];
  const signal = signalFor(contract, quote?.price ?? 0);
  const triggeredAlerts = alerts.filter((alert) => alertTriggered(alert, quotesByKey.get(alert.contractKey)));

  const loadMarket = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = window.desktop?.getFuturesMarket
        ? await window.desktop.getFuturesMarket(selectedKey) as FuturesMarketResponse
        : fallbackMarket(selectedKey);
      setMarket(response);
      setHistory(recordDailyHistory(response.quotes));
      setError(response.partial ? '部分行情节点暂时不可用，已保留最近一次有效数据。' : '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '行情刷新失败，请稍后重试。');
      setMarket((current) => current.quotes.length ? current : fallbackMarket(selectedKey));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    void loadMarket(false);
  }, [loadMarket]);

  useEffect(() => {
    localStorage.setItem(AUTO_KEY, autoRefresh ? 'on' : 'off');
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void loadMarket(true), 60_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadMarket]);

  useEffect(() => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    alerts.forEach((alert) => {
      const triggered = alertTriggered(alert, quotesByKey.get(alert.contractKey));
      if (!triggered) {
        notifiedAlerts.current.delete(alert.id);
        return;
      }
      if (notifiedAlerts.current.has(alert.id)) return;
      notifiedAlerts.current.add(alert.id);
      const alertContract = futureContractByKey(alert.contractKey);
      window.desktop?.notify('期货价格预警', `${alertContract.name}：${alert.label}`);
    });
  }, [alerts, quotesByKey]);

  useEffect(() => {
    FUTURE_CONTRACTS.forEach((item) => {
      const itemQuote = quotesByKey.get(item.key);
      const monitored = item.thresholds.filter((threshold) => threshold.tone === 'danger' || threshold.tone === 'warning');
      const active = monitored.find((threshold) => threshold.tone === 'danger' && itemQuote && thresholdTriggered(threshold, itemQuote.price))
        ?? monitored.find((threshold) => threshold.tone === 'warning' && itemQuote && thresholdTriggered(threshold, itemQuote.price));

      monitored.forEach((threshold) => {
        const key = `${item.key}:${threshold.tone}:${threshold.value}`;
        if (threshold !== active) notifiedPresetThresholds.current.delete(key);
      });
      if (!active || !itemQuote) return;

      const key = `${item.key}:${active.tone}:${active.value}`;
      if (notifiedPresetThresholds.current.has(key)) return;
      notifiedPresetThresholds.current.add(key);
      window.desktop?.notify(
        `期货${active.label} · ${item.code}`,
        `${formatCompactPrice(itemQuote.price, item)}：${active.action ?? '请执行预设风险纪律。'}`,
      );
    });
  }, [quotesByKey]);

  const dailyChartData = useMemo<FuturesKlineChartPoint[]>(() => market.dailyK.map((point) => ({
    ...point,
    range: [point.low, point.high],
  })), [market.dailyK]);

  const chartData = useMemo<Array<{ time: string; price: number; average: number | null; volume?: number }>>(() => {
    if (chartRange === 'history') return (history[selectedKey] ?? []).map((point) => ({ time: point.date, price: point.price, average: null }));
    return market.trend.map((point) => ({ ...point, time: point.time }));
  }, [chartRange, history, market.trend, selectedKey]);

  const chartDomain = useMemo(() => {
    const prices = chartRange === 'daily'
      ? dailyChartData.flatMap((point) => [point.low, point.high])
      : chartData.map((point) => Number(point.price));
    const validPrices = prices.filter(Number.isFinite);
    if (!validPrices.length) return ['auto', 'auto'] as const;
    const min = Math.min(...validPrices);
    const max = Math.max(...validPrices);
    const padding = Math.max((max - min) * 0.12, max * 0.003);
    return [Math.floor(min - padding), Math.ceil(max + padding)] as const;
  }, [chartData, chartRange, dailyChartData]);

  function submitAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(alertDraft.value);
    if (!Number.isFinite(value) || value <= 0) return;
    setAlerts((current) => [{
      id: `future-alert-${Date.now()}`,
      contractKey: alertDraft.contractKey,
      direction: alertDraft.direction,
      value,
      label: alertDraft.label.trim() || '价格提醒',
      enabled: true,
    }, ...current]);
    setShowAlertForm(false);
  }

  function openSixFluoroPrice() {
    if (window.desktop?.openExternal) {
      void window.desktop.openExternal(SIX_FLUORO_PRICE_URL);
      return;
    }
    window.open(SIX_FLUORO_PRICE_URL, '_blank', 'noopener,noreferrer');
  }

  const priceChange = quote ? quote.price - quote.previousClose : 0;
  const isUp = (quote?.percent ?? 0) >= 0;
  const progress = contract.scale && quote
    ? Math.max(0, Math.min(100, ((quote.price - contract.scale[0]) / (contract.scale[1] - contract.scale[0])) * 100))
    : 50;

  return (
    <div className="futures-view">
      <section className="futures-status-bar">
        <div className="futures-status-copy">
          <span className="futures-live-mark"><i /> 行情监控</span>
          <div>
            <strong>新能源与工业品期货</strong>
            <small>主连合约 · 分时与日 K · 红线预警 · 本地历史</small>
          </div>
        </div>
        <div className="futures-source-state">
          {market.demo ? <WifiOff size={16} /> : <Wifi size={16} />}
          <span><strong>{market.demo ? '演示快照' : market.source}</strong><small>{formatClock(market.fetchedAt)} 更新</small></span>
        </div>
        <div className="futures-status-actions">
          <button type="button" className={autoRefresh ? 'active' : ''} onClick={() => setAutoRefresh((value) => !value)}>
            <Clock3 size={15} /> 自动刷新 {autoRefresh ? '开' : '关'}
          </button>
          <button type="button" onClick={() => void loadMarket(false)} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> {loading ? '刷新中' : '立即刷新'}
          </button>
        </div>
        <button type="button" className="futures-industry-link" title="查看生意社六氟磷酸锂（电池级）基准价" onClick={openSixFluoroPrice}>
          <span>六氟磷酸锂（现货）</span>
          <strong><ExternalLink size={14} /> 点击查询最新价</strong>
          <small>生意社基准价 · 每日更新</small>
        </button>
      </section>

      {(error || signal.tone === 'danger' || triggeredAlerts.length > 0) && (
        <div className={`futures-alert-strip ${signal.tone === 'danger' || triggeredAlerts.length ? 'danger' : 'warning'}`} role="status">
          <AlertTriangle size={17} />
          <strong>{triggeredAlerts.length ? `${triggeredAlerts.length} 条自定义预警已触发` : signal.title}</strong>
          <span>{error || triggeredAlerts[0]?.label || signal.detail}</span>
        </div>
      )}

      <section className="futures-terminal-grid">
        <aside className="futures-watchlist" aria-label="行情自选列表">
          <div className="futures-panel-head">
            <div><span>MARKET WATCH</span><h2>自选行情</h2></div>
            <small>{market.quotes.length}/7</small>
          </div>
          <div className="futures-watchlist-items">
            {FUTURE_CONTRACTS.map((item) => {
              const itemQuote = quotesByKey.get(item.key);
              const itemUp = (itemQuote?.percent ?? 0) >= 0;
              return (
                <button
                  type="button"
                  key={item.key}
                  className={selectedKey === item.key ? 'selected' : ''}
                  onClick={() => setSelectedKey(item.key)}
                >
                  <span className="futures-contract-code" style={{ '--contract-color': item.color } as CSSProperties}>{item.code}</span>
                  <span className="futures-contract-copy"><strong>{item.name}</strong><small>{item.marketLabel} · {item.chain}</small></span>
                  <span className={`futures-watch-price ${itemUp ? 'up' : 'down'}`}>
                    <strong>{itemQuote ? formatNumber(itemQuote.price, item.digits) : '--'}</strong>
                    <small>{itemQuote ? `${itemUp ? '+' : ''}${itemQuote.percent.toFixed(2)}%` : '等待数据'}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
          <div className="futures-watch-foot"><i /> 涨红跌绿 · 数据延迟仅供参考</div>
        </aside>

        <article className="futures-market-card">
          <header className="futures-market-head">
            <div>
              <span className="futures-market-label"><Activity size={14} /> {contract.marketLabel} · {contract.code}</span>
              <h2>{contract.name}</h2>
              <p>{contract.chain}</p>
            </div>
            <div className={`futures-main-price ${isUp ? 'up' : 'down'}`}>
              <strong>{quote ? formatNumber(quote.price, contract.digits) : '--'}</strong>
              <span>{contract.unit}</span>
              <small>{isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {isUp ? '+' : ''}{formatNumber(priceChange, contract.digits)} · {isUp ? '+' : ''}{quote?.percent.toFixed(2) ?? '--'}%</small>
            </div>
          </header>

          <div className="futures-chart-tabs" role="tablist" aria-label="图表周期">
            <button type="button" role="tab" aria-selected={chartRange === 'intraday'} className={chartRange === 'intraday' ? 'active' : ''} onClick={() => setChartRange('intraday')}>今日分时</button>
            <button type="button" role="tab" aria-selected={chartRange === 'daily'} className={chartRange === 'daily' ? 'active' : ''} onClick={() => setChartRange('daily')}>日 K</button>
            <button type="button" role="tab" aria-selected={chartRange === 'history'} className={chartRange === 'history' ? 'active' : ''} onClick={() => setChartRange('history')}>本地 90 日</button>
            <span>{chartRange === 'intraday'
              ? `${market.trend.length} 个真实分时点`
              : chartRange === 'daily'
                ? `${market.dailyK.length} 个真实交易日`
                : `${history[selectedKey]?.length ?? 0} 个本地交易日`}</span>
          </div>

          <div className="futures-chart-wrap">
            {chartRange === 'daily' ? (
              dailyChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyChartData} margin={{ top: 12, right: 8, bottom: 0, left: 2 }} barCategoryGap="18%">
                    <CartesianGrid vertical={false} stroke="#e8ebf2" strokeDasharray="3 6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8c94a4', fontSize: 11 }} minTickGap={46} tickFormatter={(value) => String(value).slice(5)} />
                    <YAxis domain={chartDomain} axisLine={false} tickLine={false} tick={{ fill: '#8c94a4', fontSize: 11 }} width={62} tickFormatter={(value) => formatNumber(Number(value), contract.digits)} />
                    <Tooltip content={<FuturesKlineTooltip digits={contract.digits} />} cursor={{ fill: 'rgba(98, 107, 210, 0.05)' }} />
                    <Bar dataKey="range" shape={(props) => <FuturesCandle {...(props as unknown as FuturesCandleProps)} />} isAnimationActive={false} />
                    {contract.thresholds.map((threshold) => (
                      <ReferenceLine key={threshold.value} y={threshold.value} stroke={threshold.tone === 'danger' ? '#cf5c68' : threshold.tone === 'positive' ? '#4c9b78' : '#c49343'} strokeDasharray="4 5" label={{ value: threshold.label, position: 'insideTopRight', fill: '#767f90', fontSize: 10 }} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="futures-chart-empty"><ChartNoAxesCombined size={25} /><strong>日 K 数据暂时不可用</strong><span>刷新后会再次尝试读取公开历史行情。</span></div>
              )
            ) : chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 2 }}>
                  <CartesianGrid vertical={false} stroke="#e8ebf2" strokeDasharray="3 6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#8c94a4', fontSize: 11 }} minTickGap={46} tickFormatter={(value) => chartRange === 'intraday' ? String(value).slice(11, 16) : String(value).slice(5)} />
                  <YAxis domain={chartDomain} axisLine={false} tickLine={false} tick={{ fill: '#8c94a4', fontSize: 11 }} width={62} tickFormatter={(value) => formatNumber(Number(value), contract.digits)} />
                  <Tooltip content={<FuturesTooltip digits={contract.digits} />} cursor={{ stroke: '#8f98c6', strokeDasharray: '3 4' }} />
                  {chartRange === 'intraday' && <Area type="monotone" dataKey="average" stroke="#c39448" fill="none" strokeWidth={1.2} dot={false} connectNulls />}
                  <Area type="monotone" dataKey="price" stroke={contract.color} fill={contract.color} fillOpacity={0.12} strokeWidth={2.2} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  {contract.thresholds.map((threshold) => (
                    <ReferenceLine key={threshold.value} y={threshold.value} stroke={threshold.tone === 'danger' ? '#cf5c68' : threshold.tone === 'positive' ? '#4c9b78' : '#c49343'} strokeDasharray="4 5" label={{ value: threshold.label, position: 'insideTopRight', fill: '#767f90', fontSize: 10 }} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="futures-chart-empty"><ChartNoAxesCombined size={25} /><strong>历史曲线正在积累</strong><span>每天打开一次，工作台会自动保留当天收盘快照。</span></div>
            )}
          </div>

          <div className="futures-quote-metrics">
            <div><span>今开</span><strong>{quote ? formatNumber(quote.open, contract.digits) : '--'}</strong></div>
            <div><span>最高</span><strong className="up">{quote ? formatNumber(quote.high, contract.digits) : '--'}</strong></div>
            <div><span>最低</span><strong className="down">{quote ? formatNumber(quote.low, contract.digits) : '--'}</strong></div>
            <div><span>昨收</span><strong>{quote ? formatNumber(quote.previousClose, contract.digits) : '--'}</strong></div>
          </div>
        </article>

        <aside className="futures-signal-panel">
          <div className="futures-panel-head">
            <div><span>RISK SIGNAL</span><h2>纪律与预警</h2></div>
            <button type="button" className="futures-icon-button" aria-label="新增价格预警" onClick={() => setShowAlertForm(true)}><Plus size={17} /></button>
          </div>

          <div className={`futures-signal-card ${signal.tone}`}>
            <span><ShieldAlert size={18} /> 当前信号</span>
            <strong>{signal.title}</strong>
            <p>{signal.detail}</p>
          </div>

          {contract.scale && (
            <div className="futures-threshold-box">
              <div className="futures-threshold-title"><span><Gauge size={15} /> 价格区间</span><strong>{progress.toFixed(0)}%</strong></div>
              <div className="futures-threshold-track">
                {contract.thresholds.map((threshold) => {
                  const marker = ((threshold.value - contract.scale![0]) / (contract.scale![1] - contract.scale![0])) * 100;
                  return <i key={threshold.value} className={threshold.tone} style={{ left: `${marker}%` }} title={`${threshold.label} ${formatNumber(threshold.value, contract.digits)}`} />;
                })}
                <b style={{ left: `${progress}%` }} />
              </div>
              <div className="futures-threshold-labels"><span>{formatNumber(contract.scale[0], contract.digits)}</span><span>{formatNumber(contract.scale[1], contract.digits)}</span></div>
            </div>
          )}

          <div className="futures-preset-rules">
            <h3>当前品种规则</h3>
            {contract.thresholds.length ? contract.thresholds.map((threshold) => (
              <div key={threshold.value}>
                <i className={threshold.tone} />
                <span><strong>{threshold.label}</strong><small>{formatNumber(threshold.value, contract.digits)} {contract.unit}</small></span>
                <b>{quote && thresholdTriggered(threshold, quote.price) ? '已触发' : '监控中'}</b>
              </div>
            )) : <p className="futures-muted-note">该品种作为产业链辅助温度计，暂未配置固定红线。</p>}
          </div>

          <div className="futures-custom-alerts">
            <div className="futures-custom-alerts-head"><h3>我的价格提醒</h3><span>{alerts.length}</span></div>
            {alerts.slice(0, 4).map((alert) => {
              const alertContract = futureContractByKey(alert.contractKey);
              const triggered = alertTriggered(alert, quotesByKey.get(alert.contractKey));
              return (
                <div className={triggered ? 'triggered' : ''} key={alert.id}>
                  <button type="button" aria-label={alert.enabled ? '停用预警' : '启用预警'} onClick={() => setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, enabled: !item.enabled } : item))}>
                    {triggered ? <BellRing size={15} /> : alert.enabled ? <Bell size={15} /> : <Bell size={15} opacity={0.4} />}
                  </button>
                  <span><strong>{alertContract.code} · {alert.label}</strong><small>{alert.direction === 'above' ? '≥' : '≤'} {formatNumber(alert.value, alertContract.digits)}</small></span>
                  <button type="button" aria-label="删除预警" onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}><Trash2 size={14} /></button>
                </div>
              );
            })}
            {!alerts.length && <p className="futures-muted-note">还没有自定义提醒。点击右上角“+”添加一条。</p>}
          </div>
        </aside>
      </section>

      <section className="futures-rulebook">
        <div className="futures-rulebook-head">
          <div><span>DECISION RULEBOOK</span><h2>风险红线与操作纪律</h2><p>把价格信号变成可复核的动作，不用临盘情绪替代判断。</p></div>
          <div className="futures-disclaimer"><AlertTriangle size={15} /> 仅供个人研究，不构成投资建议</div>
        </div>
        <div className="futures-rule-table" role="table" aria-label="七个品种的预警线与风险红线">
          <div className="futures-rule-table-head" role="row">
            <span role="columnheader">指标</span><span role="columnheader">当前价</span><span role="columnheader">预警线</span><span role="columnheader">红线</span><span role="columnheader">红线含义 / 动作</span>
          </div>
          {FUTURE_CONTRACTS.map((item) => {
            const itemQuote = quotesByKey.get(item.key);
            const itemSignal = signalFor(item, itemQuote?.price ?? 0);
            const warning = item.thresholds.find((threshold) => threshold.tone === 'warning');
            const danger = item.thresholds.find((threshold) => threshold.tone === 'danger');
            return (
              <div className={`futures-rule-row ${itemSignal.tone}`} role="row" key={item.key}>
                <span role="cell" className="futures-rule-instrument"><small>指标</small><strong>{item.code} · {item.name.replace('主连', '')}</strong></span>
                <span role="cell" className="futures-rule-current"><small>当前价</small><strong>{itemQuote ? formatCompactPrice(itemQuote.price, item) : '--'}</strong><b>{itemSignal.tone === 'danger' ? '红线' : itemSignal.tone === 'warning' ? '预警' : itemSignal.tone === 'positive' ? '确认' : '安全'}</b></span>
                <span role="cell"><small>预警线</small><strong>{warning ? formatCompactPrice(warning.value, item) : '--'}</strong></span>
                <span role="cell" className="futures-rule-danger"><small>红线</small><strong>{danger ? formatCompactPrice(danger.value, item) : '--'}</strong></span>
                <span role="cell" className="futures-rule-action"><small>红线含义 / 动作</small><strong>{danger?.action ?? '暂未配置固定动作。'}</strong>{item.key === 'psm' && <em>上行保留 3.7–4.0 万确认区</em>}</span>
              </div>
            );
          })}
        </div>
      </section>

      {showAlertForm && (
        <div className="futures-modal-backdrop" role="presentation" onMouseDown={() => setShowAlertForm(false)}>
          <form className="futures-alert-form" onSubmit={submitAlert} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>PRICE ALERT</span><h2>新增价格提醒</h2></div><button type="button" aria-label="关闭" onClick={() => setShowAlertForm(false)}><X size={18} /></button></header>
            <label><span>监控品种</span><AppSelect ariaLabel="选择监控品种" value={alertDraft.contractKey} options={FUTURE_CONTRACTS.map((item) => ({ value: item.key, label: `${item.code} · ${item.name}` }))} onChange={(value) => setAlertDraft((draft) => ({ ...draft, contractKey: value as FutureContractKey }))} /></label>
            <label><span>触发方向</span><AppSelect ariaLabel="选择触发方向" value={alertDraft.direction} options={[{ value: 'below', label: '价格小于或等于' }, { value: 'above', label: '价格大于或等于' }]} onChange={(value) => setAlertDraft((draft) => ({ ...draft, direction: value as 'above' | 'below' }))} /></label>
            <label><span>目标价格</span><input type="number" min="0" step="any" required value={alertDraft.value} onChange={(event) => setAlertDraft((draft) => ({ ...draft, value: event.target.value }))} /></label>
            <label><span>提醒名称</span><input value={alertDraft.label} maxLength={32} onChange={(event) => setAlertDraft((draft) => ({ ...draft, label: event.target.value }))} placeholder="例如：跌破成本线" /></label>
            <div className="futures-alert-form-note"><Check size={14} /> 提醒与开关将保存到本机；桌面版触发后会发送系统通知。</div>
            <footer><button type="button" onClick={() => setShowAlertForm(false)}>取消</button><button type="submit">保存提醒</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
