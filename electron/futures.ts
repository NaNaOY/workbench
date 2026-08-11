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

const headers = {
  'User-Agent': 'WorkBench-Desktop/0.2.2',
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

async function fetchQuote(contract: ContractEndpoint, allowCached = true) {
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
  const cached = allowCached ? quoteCache.get(contract.key) : undefined;
  return cached ? { ...cached, stale: true } : null;
}

async function fetchFuturesMarket(selectedKey: FutureContractKey, force = false) {
  const selected = CONTRACTS.find((contract) => contract.key === selectedKey) ?? CONTRACTS[0];
  const quoteResults = await Promise.all(CONTRACTS.map((contract) => fetchQuote(contract, !force)));
  const quotes = quoteResults.filter((quote): quote is FuturesQuote => Boolean(quote));
  if (!quotes.length) throw new Error('暂时无法连接行情节点，请稍后重试。');
  return {
    quotes,
    selectedKey: selected.key,
    fetchedAt: new Date().toISOString(),
    source: '东方财富公开行情',
    partial: quotes.length < CONTRACTS.length || quotes.some((quote) => quote.stale),
  };
}

export function registerFuturesIpc() {
  ipcMain.handle('futures:get-market', (_event, rawKey: unknown, rawForce: unknown) => {
    const selected = CONTRACTS.find((contract) => contract.key === rawKey)?.key ?? 'lcm';
    return fetchFuturesMarket(selected, rawForce === true);
  });
}
