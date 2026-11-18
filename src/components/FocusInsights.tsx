import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Target } from 'lucide-react';
import { localDateKey } from '../data';
import type { FocusRecord } from '../types';

const HEATMAP_WEEKS = 26;
const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

function shiftDate(value: string, amount: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function formatDuration(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} 分钟`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${hours} 小时 ${remainder} 分钟` : `${hours} 小时`;
}

function formatCompactDuration(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded}分钟`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${hours}小时 ${remainder}分` : `${hours}小时`;
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parseDateKey(value));
}

function formatCellDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseDateKey(value));
}

function formatCompletedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未记录';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function intensityFor(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes <= 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

interface DaySummary {
  minutes: number;
  sessions: number;
  records: FocusRecord[];
}

export function FocusInsights({ records }: { records: FocusRecord[] }) {
  const today = localDateKey();
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setSelectedDate((current) => current > today ? today : current);
  }, [today]);

  const summaries = useMemo(() => {
    const result = new Map<string, DaySummary>();
    records.forEach((record) => {
      const current = result.get(record.date) ?? { minutes: 0, sessions: 0, records: [] };
      current.minutes += record.minutes;
      current.sessions += record.sessions;
      current.records.push(record);
      result.set(record.date, current);
    });
    result.forEach((summary) => summary.records.sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
    return result;
  }, [records]);

  const days = useMemo(() => {
    const end = parseDateKey(today);
    const weekday = (end.getDay() + 6) % 7;
    const firstMonday = new Date(end);
    firstMonday.setDate(firstMonday.getDate() - weekday - ((HEATMAP_WEEKS - 1) * 7));
    return Array.from({ length: HEATMAP_WEEKS * 7 }, (_, index) => {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + index);
      return localDateKey(date);
    });
  }, [today]);

  const totalMinutes = records.reduce((sum, record) => sum + record.minutes, 0);
  const totalSessions = records.reduce((sum, record) => sum + record.sessions, 0);
  const activeDays = summaries.size;
  const activeDayAverage = activeDays ? Math.round(totalMinutes / activeDays) : 0;
  const visibleActiveDays = days.reduce((count, date) => count + (summaries.has(date) ? 1 : 0), 0);
  const selected = summaries.get(selectedDate) ?? { minutes: 0, sessions: 0, records: [] };

  const distribution = useMemo(() => {
    const projects = new Map<string, number>();
    selected.records.forEach((record) => {
      projects.set(record.project, (projects.get(record.project) ?? 0) + record.minutes);
    });
    return [...projects.entries()]
      .map(([project, minutes]) => ({ project, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [selected.records]);

  return (
    <section className="focus-insights" aria-labelledby="focus-insights-title">
      <header className="focus-insights-header">
        <div className="focus-insights-copy">
          <span>专注足迹</span>
          <h2 id="focus-insights-title">把每天投入，变成看得见的积累。</h2>
          <p>每次完成的专注时段都会自动保存在本机；点击日期，可回看当天时间去向。</p>
        </div>
        <div className="focus-overview" aria-label="累计专注概览">
          <div><Target size={17} aria-hidden="true" /><span>累计时段<strong>{totalSessions}</strong><small>个</small></span></div>
          <div><Clock3 size={17} aria-hidden="true" /><span>累计时长<strong>{formatCompactDuration(totalMinutes)}</strong></span></div>
          <div><CalendarDays size={17} aria-hidden="true" /><span>活跃日均<strong>{formatCompactDuration(activeDayAverage)}</strong></span></div>
        </div>
      </header>

      <div className="focus-insights-body">
        <div className="focus-heatmap-panel">
          <div className="focus-section-heading">
            <div><strong>近 26 周</strong><span>{visibleActiveDays} 个活跃日</span></div>
            <div className="heatmap-legend" aria-label="专注强度图例"><span>少</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}<span>多</span></div>
          </div>
          <div className="heatmap-scroller">
            <div className="heatmap-weekdays" aria-hidden="true">{DAY_LABELS.map((label) => <span key={label}>{label}</span>)}</div>
            <div className="focus-heatmap" role="grid" aria-label="每日专注热力图">
              {days.map((date) => {
                const summary = summaries.get(date);
                const minutes = summary?.minutes ?? 0;
                const sessions = summary?.sessions ?? 0;
                const isFuture = date > today;
                const label = `${formatCellDate(date)}，${formatDuration(minutes)}，${sessions} 个时段`;
                return (
                  <button
                    type="button"
                    role="gridcell"
                    key={date}
                    className={`${date === selectedDate ? 'selected' : ''} ${date === today ? 'today' : ''}`}
                    data-level={intensityFor(minutes)}
                    disabled={isFuture}
                    aria-label={label}
                    aria-selected={date === selectedDate}
                    title={label}
                    onClick={() => setSelectedDate(date)}
                  />
                );
              })}
            </div>
          </div>
          <p className="focus-heatmap-note">颜色越深，代表当天投入越久。历史记录只保存在你的本地工作台。</p>
        </div>

        <aside className="focus-day-panel" aria-label="选中日期的专注详情">
          <header className="focus-day-heading">
            <div><span>当日专注</span><strong>{formatSelectedDate(selectedDate)}</strong></div>
            <div className="focus-day-navigation">
              <button type="button" aria-label="查看前一天" onClick={() => setSelectedDate((date) => shiftDate(date, -1))}><ChevronLeft size={16} /></button>
              <button type="button" aria-label="查看后一天" disabled={selectedDate >= today} onClick={() => setSelectedDate((date) => shiftDate(date, 1))}><ChevronRight size={16} /></button>
            </div>
          </header>

          <div className="focus-day-summary">
            <div><span>完成</span><strong>{selected.sessions}<small> 个时段</small></strong></div>
            <div><span>投入</span><strong>{formatDuration(selected.minutes)}</strong></div>
          </div>

          {selected.records.length ? (
            <>
              <div className="focus-distribution">
                <div className="focus-subheading"><strong>时间去向</strong><span>{distribution.length} 个场景</span></div>
                <div className="focus-distribution-list">
                  {distribution.map((item) => {
                    const share = selected.minutes ? Math.round((item.minutes / selected.minutes) * 100) : 0;
                    return (
                      <div className="focus-distribution-row" key={item.project}>
                        <div><span title={item.project}>{item.project}</span><strong>{formatDuration(item.minutes)}</strong></div>
                        <i><b style={{ '--share': `${share}%` } as CSSProperties} /></i>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="focus-records">
                <div className="focus-subheading"><strong>专注记录</strong><span>{selected.records.length} 条</span></div>
                <div className="focus-record-list">
                  {selected.records.map((record) => (
                    <article key={record.id}>
                      <i />
                      <div><strong>{record.taskTitle}</strong><span>{record.project} · {formatCompletedTime(record.completedAt)} 完成</span></div>
                      <small>{record.sessions > 1 ? `${record.sessions} × ` : ''}{formatCompactDuration(record.minutes)}</small>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="focus-day-empty">
              <span><CalendarDays size={19} aria-hidden="true" /></span>
              <strong>{selectedDate === today ? '今天还没有完成专注' : '这一天没有专注记录'}</strong>
              <p>{selectedDate === today ? '完成一个 25 分钟时段后，这里会自动生成当天记录。' : '可以点击热力图中的其他日期继续回看。'}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}