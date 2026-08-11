export type FutureContractKey = 'lcm' | 'idx' | 'psm' | 'sim' | 'sam' | 'fgm' | 'cum';

export interface FutureThreshold {
  value: number;
  label: string;
  tone: 'danger' | 'warning' | 'positive';
  direction?: 'below' | 'above';
  action?: string;
}

export interface FutureContractConfig {
  key: FutureContractKey;
  secid: string;
  name: string;
  code: string;
  marketLabel: string;
  chain: string;
  unit: string;
  digits: number;
  color: string;
  thresholds: FutureThreshold[];
  scale?: [number, number];
}

export const FUTURE_CONTRACTS: FutureContractConfig[] = [
  {
    key: 'lcm',
    secid: '225.LCM',
    name: '碳酸锂主连',
    code: 'LC',
    marketLabel: '广期所',
    chain: '储能 · 锂电材料',
    unit: '元/吨',
    digits: 0,
    color: '#7b6fe8',
    thresholds: [
      { value: 120000, label: '红线', tone: 'danger', action: '先减天赐，新能源篮子减半。' },
      { value: 130000, label: '预警线', tone: 'warning', action: '进入预警区，复核现货、库存与持仓节奏。' },
    ],
    scale: [100000, 160000],
  },
  {
    key: 'idx',
    secid: '1.000941',
    name: '新能源指数',
    code: '000941',
    marketLabel: '中证指数',
    chain: '新能源板块温度',
    unit: '点',
    digits: 2,
    color: '#d49a42',
    thresholds: [
      { value: 2077, label: '红线', tone: 'danger', action: '执行硬止损，总仓位降低 20%。' },
      { value: 2227, label: '预警线', tone: 'warning', action: '暂停新增仓位，复核新能源篮子风险敞口。' },
    ],
    scale: [1900, 2600],
  },
  {
    key: 'psm',
    secid: '225.PSM',
    name: '多晶硅主连',
    code: 'PS',
    marketLabel: '广期所',
    chain: '光伏硅料 · 右侧确认',
    unit: '元/吨',
    digits: 0,
    color: '#3f9b8c',
    thresholds: [
      { value: 30000, label: '红线', tone: 'danger', action: '击穿现金成本，“反内卷”逻辑证伪，通威移出观察名单。' },
      { value: 34000, label: '预警线', tone: 'warning', action: '进入现金成本压力区，复核现货、库存与开工率。' },
      { value: 37000, label: '确认区下沿', tone: 'positive', direction: 'above', action: '进入 3.7–4.0 万上行确认区。' },
      { value: 40000, label: '确认区上沿', tone: 'positive', direction: 'above', action: '站稳后完成期货端右侧确认。' },
    ],
    scale: [30000, 45000],
  },
  {
    key: 'sim',
    secid: '225.SIM',
    name: '工业硅主连',
    code: 'SI',
    marketLabel: '广期所',
    chain: '光伏上游原料',
    unit: '元/吨',
    digits: 0,
    color: '#5d86c7',
    thresholds: [
      { value: 7800, label: '红线', tone: 'danger', action: '全行业现金成本击穿，硅料成本端坍塌。' },
      { value: 8200, label: '预警线', tone: 'warning', action: '进入行业现金成本压力区，关注硅料成本传导。' },
    ],
    scale: [7000, 9500],
  },
  {
    key: 'sam',
    secid: '115.SAM',
    name: '纯碱主连',
    code: 'SA',
    marketLabel: '郑商所',
    chain: '光伏玻璃原料',
    unit: '元/吨',
    digits: 0,
    color: '#6aa176',
    thresholds: [
      { value: 900, label: '红线', tone: 'danger', action: '光伏玻璃排产需求大幅走弱。' },
      { value: 960, label: '预警线', tone: 'warning', action: '需求边际转弱，复核玻璃排产与库存。' },
    ],
    scale: [850, 1100],
  },
  {
    key: 'fgm',
    secid: '115.FGM',
    name: '玻璃主连',
    code: 'FG',
    marketLabel: '郑商所',
    chain: '光伏玻璃链',
    unit: '元/吨',
    digits: 0,
    color: '#6f91a3',
    thresholds: [
      { value: 800, label: '红线', tone: 'danger', action: '击穿玻璃现金成本，组件排产收缩。' },
      { value: 860, label: '预警线', tone: 'warning', action: '进入玻璃现金成本压力区，观察组件排产。' },
    ],
    scale: [750, 1150],
  },
  {
    key: 'cum',
    secid: '113.cum',
    name: '沪铜主连',
    code: 'CU',
    marketLabel: '上期所',
    chain: '电网 · 储能 · 新能源车',
    unit: '元/吨',
    digits: 0,
    color: '#b77a4f',
    thresholds: [
      { value: 95000, label: '红线', tone: 'danger', action: '宏观需求转弱，复核电网与储能景气。' },
      { value: 100000, label: '预警线', tone: 'warning', action: '宏观需求进入预警区，复核电网、储能订单。' },
    ],
    scale: [90000, 115000],
  },
];

export function futureContractByKey(key: string) {
  return FUTURE_CONTRACTS.find((contract) => contract.key === key) ?? FUTURE_CONTRACTS[0];
}
