import { ipcMain, net } from 'electron';

type FutureContractKey = 'lcm' | 'idx' | 'psm' | 'sim' | 'sam' | 'fgm' | 'cum';

interface ContractEndpoint {
  key: FutureContractKey;
  secid: string;
}

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

const CONTRACTS: ContractEndpoint[] = [
  { key: 'lcm', secid: '225.LCM' },
  { key: 'idx', secid: '1.000941' },
  { key: 'psm', secid: '225.PSM' },
  { key: 'sim', secid: '225.SIM' },
  { key: 'sam', secid: '115.SAM' },
  { key: 'fgm', secid: '115.FGM' },
  { key: 'cum', secid: '113.cum' },
];

const QUOTE_HOSTS = [
  'https://push2delay.eastmoney.com',
  'https://82.push2.eastmoney.com',
  'https://6.push2.eastmoney.com',
  'https://push2.eastmoney.com',
];

const quoteCache = new Map<FutureContractKey, FuturesQuote>();
const trendCache = new Map<FutureContractKey, FuturesTrendPoint[]>();
const klineCache = new Map<FutureContractKey, FuturesKlinePoint[]>();

const headers = {
  'User-Agent': 'WorkBench-Desktop/0.2.0',
  Accept: 'application/json,text/plain,*/*',
  Referer: 'https://quote.eastmoney.com/',
};

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function marketIso(timestamp: unknown) {
  const seconds = numberValue(timestamp);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : new Date().toISOString();
}

async function fetchJson(url: string, timeout = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await net.fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchQuote(contract: ContractEndpoint) {
  for (const host of QUOTE_HOSTS) {
    try {
      const params = new URLSearchParams({
        secid: contract.secid,
        fields: 'f43,f44,f45,f46,f57,f58,f60,f86,f170',
        fltt: '2',
        invt: '2',
        refresh: Date.now().toString(),
      });
      const payload = await fetchJson(`${host}/api/qt/stock/get?${params.toString()}`);
      const data = payload.data as Record<string, unknown> | null | undefined;
      if (!data || !Number.isFinite(Number(data.f43))) continue;
      const quote: FuturesQuote = {
        key: contract.key,
        price: numberValue(data.f43),
        high: numberValue(data.f44),
        low: numberValue(data.f45),
        open: numberValue(data.f46),
        previousClose: numberValue(data.f60),
        percent: numberValue(data.f170),
        name: String(data.f58 || contract.key),
        code: String(data.f57 || contract.secid),
        marketTime: marketIso(data.f86),
        stale: false,
      };
      quoteCache.set(contract.key, quote);
      return quote;
    } catch {
      // Try the next public quote node.
    }
  }
  const cached = quoteCache.get(contract.key);
  return cached ? { ...cached, stale: true } : null;
}

async function fetchTrend(contract: ContractEndpoint) {
  try {
    const params = new URLSearchParams({
      secid: contract.secid,
      fields1: 'f1,f2,f3,f4,f5,f6,f7,f8',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58',
      iscr: '0',
      ndays: '1',
      refresh: Date.now().toString(),
    });
    const payload = await fetchJson(`https://push2his.eastmoney.com/api/qt/stock/trends2/get?${params.toString()}`);
    const data = payload.data as { trends?: unknown } | null | undefined;
    const raw = Array.isArray(data?.trends) ? data.trends : [];
    const trend = raw.flatMap((item) => {
      const parts = String(item).split(',');
      const price = Number(parts[2]);
      if (parts.length < 8 || !Number.isFinite(price)) return [];
      const average = Number(parts[7]);
      return [{
        time: parts[0],
        price,
        average: Number.isFinite(average) ? average : null,
        volume: numberValue(parts[5]),
      } satisfies FuturesTrendPoint];
    });
    if (trend.length) trendCache.set(contract.key, trend);
    return trend;
  } catch {
    return trendCache.get(contract.key) ?? [];
  }
}

async function fetchDailyKline(contract: ContractEndpoint) {
  try {
    const params = new URLSearchParams({
      secid: contract.secid,
      fields1: 'f1,f2,f3,f4,f5,f6',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
      klt: '101',
      fqt: '1',
      beg: '0',
      end: '20500000',
      lmt: '120',
      refresh: Date.now().toString(),
    });
    const payload = await fetchJson(`https://push2his.eastmoney.com/api/qt/stock/kline/get?${params.toString()}`);
    const data = payload.data as { klines?: unknown } | null | undefined;
    const raw = Array.isArray(data?.klines) ? data.klines : [];
    const dailyK = raw.flatMap((item) => {
      const parts = String(item).split(',');
      const open = Number(parts[1]);
      const close = Number(parts[2]);
      const high = Number(parts[3]);
      const low = Number(parts[4]);
      if (parts.length < 9 || ![open, close, high, low].every(Number.isFinite)) return [];
      return [{
        date: parts[0],
        open,
        close,
        high,
        low,
        volume: numberValue(parts[5]),
        percent: numberValue(parts[8]),
      } satisfies FuturesKlinePoint];
    }).slice(-120);
    if (dailyK.length) klineCache.set(contract.key, dailyK);
    return dailyK;
  } catch {
    return klineCache.get(contract.key) ?? [];
  }
}

async function fetchFuturesMarket(selectedKey: FutureContractKey) {
  const selected = CONTRACTS.find((contract) => contract.key === selectedKey) ?? CONTRACTS[0];
  const [quoteResults, trend, dailyK] = await Promise.all([
    Promise.all(CONTRACTS.map(fetchQuote)),
    fetchTrend(selected),
    fetchDailyKline(selected),
  ]);
  const quotes = quoteResults.filter((quote): quote is FuturesQuote => Boolean(quote));
  if (!quotes.length) throw new Error('暂时无法连接行情节点，请稍后重试。');
  return {
    quotes,
    trend,
    dailyK,
    selectedKey: selected.key,
    fetchedAt: new Date().toISOString(),
    source: '东方财富公开行情',
    partial: quotes.length < CONTRACTS.length || quotes.some((quote) => quote.stale),
  };
}

export function registerFuturesIpc() {
  ipcMain.handle('futures:get-market', (_event, rawKey: unknown) => {
    const selected = CONTRACTS.find((contract) => contract.key === rawKey)?.key ?? 'lcm';
    return fetchFuturesMarket(selected);
  });
}
