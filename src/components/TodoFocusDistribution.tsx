import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, Layers3 } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
  type TooltipContentProps,
} from 'recharts';
import { focusBackgroundById } from '../todo-config';
import type { FocusRecord, TodayTodo, TodoCollection } from '../types';

type DistributionPeriod = 'day' | 'week' | 'month' | 'all';

interface DistributionItem {
  id: string;
  name: string;
  minutes: number;
  sessions: number;
  color: string;
}

interface TodoFocusDistributionProps {
  scope: string;
  anchorDate: string;
  collections: TodoCollection[];
  todos: TodayTodo[];
  records: FocusRecord[];
  onAnchorDateChange: (date: string) => void;
}

const PERIODS: Array<{ value: DistributionPeriod; label: string }> = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'all', label: '全部' },
];

const FALLBACK_COLORS = ['#ee8398', '#77c6c4', '#9bd8dc', '#78a8b0', '#f1c486', '#8e79dd', '#9aabc7'];

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCompactDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

function periodRange(period: DistributionPeriod, anchorDate: string) {
  const anchor = parseDate(anchorDate);
  if (period === 'all') return { start: '', end: '', label: '全部专注记录' };
  if (period === 'day') return { start: anchorDate, end: anchorDate, label: `${anchor.getFullYear()}年${formatCompactDate(anchor)}` };
  if (period === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
    return { start: dateKey(start), end: dateKey(end), label: `${anchor.getFullYear()}年${anchor.getMonth() + 1}月` };
  }
  const weekday = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - weekday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end), label: `${formatCompactDate(start)} – ${formatCompactDate(end)}` };
}

function shiftedDate(anchorDate: string, period: DistributionPeriod, direction: number) {
  const date = parseDate(anchorDate);
  if (period === 'month') date.setMonth(date.getMonth() + direction);
  else date.setDate(date.getDate() + direction * (period === 'week' ? 7 : 1));
  return dateKey(date);
}

function pieLabel(props: PieLabelRenderProps) {
  const rawName = String(props.name ?? '');
  const name = rawName.length > 6 ? `${rawName.slice(0, 6)}…` : rawName;
  const percent = Math.round(Number(props.percent ?? 0) * 100);
  return `${name} ${percent}%`;
}


export function TodoFocusDistribution({
  scope,
  anchorDate,
  collections,
  todos,
  records,
  onAnchorDateChange,
}: TodoFocusDistributionProps) {
  const [period, setPeriod] = useState<DistributionPeriod>('week');
  const [reduceMotion, setReduceMotion] = useState(false);
  const range = periodRange(period, anchorDate);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => period === 'all' || (record.date >= range.start && record.date <= range.end)),
    [period, range.end, range.start, records],
  );

  const chartData = useMemo(() => {
    const grouped = new Map<string, DistributionItem>();
    filteredRecords.forEach((record, recordIndex) => {
      const todo = todos.find((item) => item.id === record.todoId);
      const collectionId = record.collectionId ?? todo?.collectionId;
      const collection = collections.find((item) => item.id === collectionId);
      const groupId = scope === 'all' ? collectionId ?? `collection-${record.project}` : record.todoId ?? `todo-${record.taskTitle}`;
      const name = scope === 'all' ? collection?.name ?? record.project : todo?.title ?? record.taskTitle;
      const color = scope === 'all'
        ? collection?.color ?? FALLBACK_COLORS[recordIndex % FALLBACK_COLORS.length]
        : focusBackgroundById(todo?.backgroundId ?? record.backgroundId).accent;
      const current = grouped.get(groupId);
      if (current) {
        current.minutes += record.minutes;
        current.sessions += record.sessions;
      } else {
        grouped.set(groupId, { id: groupId, name, minutes: record.minutes, sessions: record.sessions, color });
      }
    });

    const sorted = [...grouped.values()].sort((left, right) => right.minutes - left.minutes);
    if (sorted.length <= 6) return sorted;
    const visible = sorted.slice(0, 5);
    const remainder = sorted.slice(5).reduce(
      (total, item) => ({ ...total, minutes: total.minutes + item.minutes, sessions: total.sessions + item.sessions }),
      { id: 'other', name: '其他', minutes: 0, sessions: 0, color: FALLBACK_COLORS[6] },
    );
    return [...visible, remainder];
  }, [collections, filteredRecords, scope, todos]);

  const totalMinutes = filteredRecords.reduce((sum, record) => sum + record.minutes, 0);
  const totalSessions = filteredRecords.reduce((sum, record) => sum + record.sessions, 0);
  const activeDays = new Set(filteredRecords.map((record) => record.date)).size;
  const canMoveForward = period !== 'all' && shiftedDate(anchorDate, period, 1) <= dateKey(new Date());

  return (
    <section className="todo-distribution-panel" aria-labelledby="todo-distribution-title">
      <header className="todo-distribution-heading">
        <div>
          <span>专注时长分布</span>
          <h3 id="todo-distribution-title">{range.label}</h3>
        </div>
        {period !== 'all' && (
          <div className="todo-period-navigation" aria-label="切换统计日期">
            <button type="button" aria-label="上一周期" onClick={() => onAnchorDateChange(shiftedDate(anchorDate, period, -1))}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="下一周期" disabled={!canMoveForward} onClick={() => onAnchorDateChange(shiftedDate(anchorDate, period, 1))}><ChevronRight size={16} /></button>
          </div>
        )}
      </header>

      <div className="todo-period-tabs" aria-label="专注统计周期">
        {PERIODS.map((item) => (
          <button type="button" key={item.value} className={period === item.value ? 'active' : ''} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>
            {item.label}
          </button>
        ))}
      </div>

      {chartData.length ? (
        <div className="todo-distribution-body">
          <div className="todo-distribution-chart" role="img" aria-label={`${range.label}专注时长饼图，总计${formatDuration(totalMinutes)}`}>
            <ResponsiveContainer width="100%" height={310}>
              <PieChart margin={{ top: 24, right: 68, bottom: 24, left: 68 }}>
                <Pie
                  data={chartData}
                  dataKey="minutes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={102}
                  paddingAngle={2}
                  stroke="rgba(255,255,255,.92)"
                  strokeWidth={3}
                  label={pieLabel}
                  labelLine={{ stroke: '#a7acb7', strokeWidth: 1.2 }}
                  isAnimationActive={!reduceMotion}
                  animationDuration={420}
                >
                  {chartData.map((item) => <Cell key={item.id} fill={item.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as DistributionItem;
                  return (
                    <div className="todo-distribution-tooltip">
                      <strong>{item.name}</strong>
                      <span>{formatDuration(item.minutes)} · {item.sessions} 个时段</span>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="todo-distribution-legend" aria-label="专注时间占比明细">
            {chartData.map((item) => {
              const percentage = totalMinutes ? Math.round((item.minutes / totalMinutes) * 1000) / 10 : 0;
              return (
                <div key={item.id}>
                  <i style={{ background: item.color }} />
                  <span><strong>{item.name}</strong><small>{formatDuration(item.minutes)}</small></span>
                  <b>{percentage}%</b>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="todo-distribution-empty">
          <span><Clock3 size={22} /></span>
          <strong>这个周期还没有专注记录</strong>
          <p>完成一次今日待办专注后，这里会自动形成时间分布。</p>
        </div>
      )}

      <footer className="todo-distribution-summary">
        <div><Clock3 size={16} /><span>总时长<strong>{formatDuration(totalMinutes)}</strong></span></div>
        <div><Layers3 size={16} /><span>完成时段<strong>{totalSessions} 个</strong></span></div>
        <div><span>日均<strong>{activeDays ? formatDuration(Math.round(totalMinutes / activeDays)) : '0 分钟'}</strong></span></div>
      </footer>
    </section>
  );
}
