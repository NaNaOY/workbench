import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare2,
  ChevronDown,
  Clock3,
  Command,
  ExternalLink,
  Lightbulb,
  ListTodo,
  NotebookPen,
  Pause,
  Plus,
  Sun,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { localDateKey } from './data';
import { Bookmark, Note, Priority, Task, TaskStatus } from './types';

const BASE_URL = import.meta.env.BASE_URL;
const focusSeconds = 25 * 60;
const rhythmDayLabels = ['一', '二', '三', '四', '五', '六', '日'];
const priorityText: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};
const statusText: Record<TaskStatus, string> = {
  todo: '待处理',
  doing: '进行中',
  done: '已完成',
};
const taskStatusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: '待处理' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
];

function isoToday() {
  return localDateKey();
}

function rhythmTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(value: string) {
  if (!value) return '未设日期';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 2) return '刚刚更新';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}
export function DashboardView({
  tasks,
  notes,
  focusMinutes,
  completionRate,
  dueToday,
  overdue,
  onTaskDone,
  onOpenTasks,
  onOpenNotes,
  onStartFocus,
}: {
  tasks: Task[];
  notes: Note[];
  focusMinutes: number;
  completionRate: number;
  dueToday: Task[];
  overdue: Task[];
  onTaskDone: (id: string) => void;
  onOpenTasks: () => void;
  onOpenNotes: () => void;
  onStartFocus: () => void;
}) {
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const minutesLabel = focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` : `${focusMinutes}m`;
  const visibleTasks = [...overdue, ...dueToday.filter((task) => !overdue.some((late) => late.id === task.id))].slice(0, 4);
  const todayRhythmIndex = rhythmTodayIndex();

  return (
    <div className="dashboard-stack">
      <section className="metrics-grid">
        <MetricCard icon={ListTodo} tone="lavender" label="今日待办" value={String(dueToday.length)} detail={dueToday.length ? '件任务需要推进' : '今天的清单很轻盈'} action="查看清单" onClick={onOpenTasks} />
        <MetricCard icon={CheckCircle2} tone="mint" label="完成进度" value={`${completionRate}%`} detail={`${doneCount} / ${tasks.length} 项任务已完成`} action="任务管理" onClick={onOpenTasks} />
        <MetricCard icon={Timer} tone="peach" label="专注时间" value={minutesLabel} detail="今日累计深度工作" action="开始专注" onClick={onStartFocus} />
        <MetricCard icon={NotebookPen} tone="blue" label="灵感笔记" value={String(notes.length)} detail="随时记录，不让想法溜走" action="打开笔记" onClick={onOpenNotes} />
      </section>

      <section className="dashboard-grid">
        <div className="panel task-panel">
          <div className="panel-heading">
            <div>

              <h2>今天的优先事项</h2>
            </div>
            <button type="button" className="text-button" onClick={onOpenTasks}>查看全部 <ArrowRight size={14} /></button>
          </div>
          {visibleTasks.length ? (
            <div className="today-list">
              {visibleTasks.map((task) => (
                <div className="today-task" key={task.id}>
                  <button type="button" className="check-button" aria-label={`完成 ${task.title}`} onClick={() => onTaskDone(task.id)} />
                  <div className="today-task-body">
                    <strong>{task.title}</strong>
                    <span>{task.project} · {task.due < isoToday() ? '已逾期' : formatDate(task.due)}</span>
                  </div>
                  <PriorityPill priority={task.priority} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Sun} title="今天没有待办" description="给自己留一点从容，或添加一件真正重要的事。" />
          )}
        </div>

        <div className="panel rhythm-panel">
          <div className="panel-heading">
            <div>

              <h2>保持你的节奏</h2>
            </div>
            <span className="tiny-badge">本周</span>
          </div>
          <div className="rhythm-copy"><strong>别把一天排满。</strong><span>留出一段连续、不被打扰的时间，让重要的事情自然向前。</span></div>
          <div className="mini-bars" aria-label="本周专注趋势">
            {[35, 54, 41, 78, 64, 48, 70].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === todayRhythmIndex ? 'today-bar' : ''} />)}
          </div>
          <div className="days-row">{rhythmDayLabels.map((label, index) => <span key={label} className={index === todayRhythmIndex ? 'today-day' : ''}>{label}</span>)}</div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel notes-preview">
          <div className="panel-heading">
            <div>

              <h2>最近记录</h2>
            </div>
            <button type="button" className="text-button" onClick={onOpenNotes}>全部笔记 <ArrowRight size={14} /></button>
          </div>
          <div className="note-preview-grid">
            {notes.slice(0, 3).map((note) => (
              <button type="button" onClick={onOpenNotes} className="note-card" key={note.id} style={{ background: note.color }}>
                <strong>{note.title}</strong>
                <span>{note.content || '点击开始记录…'}</span>
                <small>{relativeTime(note.updatedAt)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel quick-panel">
          <img className="quick-brand-orbit" src={`${BASE_URL}assets/brand-orbit.jpg`} alt="" aria-hidden="true" />

          <h2>给现在一个方向</h2>
          <p>把注意力交给最重要的下一步，而不是更多的通知。</p>
          <button type="button" className="dark-button" onClick={onStartFocus}>进入 25 分钟专注 <ArrowRight size={16} /></button>
          <div className="quick-foot"><span className="pulse-dot" /> 已开启本地自动保存</div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, tone, label, value, detail, action, onClick }: { icon: LucideIcon; tone: string; label: string; value: string; detail: string; action: string; onClick: () => void }) {
  return (
    <button type="button" className="metric-card" onClick={onClick}>
      <span className={`metric-icon ${tone}`}><Icon size={17} strokeWidth={1.8} /></span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
      <span className="metric-action">{action} <ArrowRight size={13} /></span>
    </button>
  );
}

export function TasksView({ taskGroups, tasks, onUpdate, onDelete, onAdd }: { taskGroups: Array<{ status: TaskStatus; title: string; hint: string }>; tasks: Task[]; onUpdate: (id: string, patch: Partial<Task>) => void; onDelete: (id: string) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState<'all' | Priority>('all');
  const displayed = filter === 'all' ? tasks : tasks.filter((task) => task.priority === filter);
  const filterCounts: Record<'all' | Priority, number> = {
    all: tasks.length,
    high: tasks.filter((task) => task.priority === 'high').length,
    medium: tasks.filter((task) => task.priority === 'medium').length,
    low: tasks.filter((task) => task.priority === 'low').length,
  };
  return (
    <div className="view-stack">
      <div className="view-toolbar">
        <div className="filter-tabs">
          {([['all', '全部'], ['high', '高优先级'], ['medium', '中优先级'], ['low', '低优先级']] as const).map(([value, label]) => (
            <button type="button" key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>
              <span>{label}</span><b>{filterCounts[value]}</b>
            </button>
          ))}
        </div>
        <button type="button" className="secondary-button" onClick={onAdd}><Plus size={16} /> 添加任务</button>
      </div>
      <div className="task-board">
        {taskGroups.map((group) => {
          const groupTasks = displayed.filter((task) => task.status === group.status);
          return (
            <section className="task-column" key={group.status}>
              <div className="column-heading">
                <div><h2>{group.title}<span>{groupTasks.length}</span></h2><p>{group.hint}</p></div>
                <span className={`column-dot ${group.status}`} />
              </div>
              <div className="task-stack">
                {groupTasks.map((task) => <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />)}
                {groupTasks.length === 0 && <div className="column-empty">这里还没有任务</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, onUpdate, onDelete }: { task: Task; onUpdate: (id: string, patch: Partial<Task>) => void; onDelete: (id: string) => void }) {
  return (
    <article className={`task-card ${task.status === 'done' ? 'completed' : ''}`}>
      <div className="task-card-top">
        <PriorityPill priority={task.priority} />
        <button type="button" className="delete-button" aria-label={`删除 ${task.title}`} onClick={() => onDelete(task.id)}><X size={14} /></button>
      </div>
      <strong>{task.title}</strong>
      <span className="task-project">{task.project}</span>
      <div className="task-card-bottom">
        <span className="due-date"><Clock3 size={13} /> {formatDate(task.due)}</span>
        <TaskStatusSelect
          value={task.status}
          taskTitle={task.title}
          onChange={(status) => onUpdate(task.id, { status })}
        />
      </div>
    </article>
  );
}

function TaskStatusSelect({ value, taskTitle, onChange }: { value: TaskStatus; taskTitle: string; onChange: (status: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 132, placement: 'down' as 'up' | 'down' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const measureMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 132;
    const estimatedHeight = 134;
    const gap = 8;
    const opensDown = window.innerHeight - rect.bottom >= estimatedHeight + gap || rect.top < estimatedHeight + gap;
    setPosition({
      top: opensDown ? rect.bottom + gap : rect.top - estimatedHeight - gap,
      left: Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width)),
      width,
      placement: opensDown ? 'down' : 'up',
    });
  };

  useEffect(() => {
    if (!open) return;
    measureMenu();

    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('resize', measureMenu);
    window.addEventListener('scroll', measureMenu, true);
    window.addEventListener('pointerdown', closeFromOutside);
    window.addEventListener('keydown', closeFromKeyboard);
    return () => {
      window.removeEventListener('resize', measureMenu);
      window.removeEventListener('scroll', measureMenu, true);
      window.removeEventListener('pointerdown', closeFromOutside);
      window.removeEventListener('keydown', closeFromKeyboard);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`task-status-trigger status-${value} ${open ? 'is-open' : ''}`}
        aria-label={`更改 ${taskTitle} 状态`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!open) measureMenu();
          setOpen((current) => !current);
        }}
      >
        <i aria-hidden="true" />
        <span>{statusText[value]}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className={`task-status-menu placement-${position.placement}`}
          role="listbox"
          aria-label={`${taskTitle}的状态`}
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          {taskStatusOptions.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={`task-status-option status-${option.value} ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <i aria-hidden="true" />
              <span>{option.label}</span>
              <b aria-hidden="true">{option.value === value ? <Check size={14} /> : null}</b>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={`priority-pill ${priority}`}><i />{priorityText[priority]}</span>;
}

export function NotesView({ notes, selectedNote, selectedId, onSelect, onCreate, onUpdate, onDelete }: { notes: Note[]; selectedNote: Note | null; selectedId: string | null; onSelect: (id: string) => void; onCreate: () => void; onUpdate: (id: string, patch: Partial<Note>) => void; onDelete: (id: string) => void }) {
  return (
    <div className="notes-layout">
      <aside className="notes-list-panel">
        <div className="notes-list-head"><div><h2>灵感库</h2></div><button type="button" className="round-add" onClick={onCreate} aria-label="新建笔记"><Plus size={17} /></button></div>
        <div className="notes-list">
          {notes.map((note) => (
            <button type="button" key={note.id} className={`note-list-item ${selectedId === note.id ? 'selected' : ''}`} onClick={() => onSelect(note.id)}>
              <span style={{ background: note.color }} />
              <div><strong>{note.title || '未命名笔记'}</strong><small>{relativeTime(note.updatedAt)}</small></div>
            </button>
          ))}
        </div>
      </aside>
      <section className="note-editor-panel">
        {selectedNote ? (
          <>
            <div className="note-editor-top"><span className="saved-indicator"><i /> 自动保存中</span><button type="button" className="text-button danger" onClick={() => onDelete(selectedNote.id)}>删除笔记</button></div>
            <input className="note-title-input" value={selectedNote.title} onChange={(event) => onUpdate(selectedNote.id, { title: event.target.value })} placeholder="笔记标题" />
            <div className="note-meta">最后更新于 {relativeTime(selectedNote.updatedAt)}</div>
            <textarea className="note-editor" value={selectedNote.content} onChange={(event) => onUpdate(selectedNote.id, { content: event.target.value })} placeholder="从一个想法开始…\n\n支持用空行整理你的段落。" />
            <div className="editor-tip"><Command size={14} /> Ctrl + N 可从任何页面快速添加任务</div>
          </>
        ) : (
          <EmptyState icon={Lightbulb} title="还没有笔记" description="记录正在酝酿的想法，未来的你会感谢现在的自己。" action="新建笔记" onAction={onCreate} />
        )}
      </section>
    </div>
  );
}

interface AppSelectOption {
  value: string;
  label: string;
}

export function AppSelect({ value, options, onChange, ariaLabel }: { value: string; options: AppSelectOption[]; onChange: (value: string) => void; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <div className={`app-select ${open ? 'is-open' : ''}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button type="button" className="app-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label}</span><ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="app-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button type="button" role="option" aria-selected={option.value === value} key={option.value} className={option.value === value ? 'selected' : ''} onClick={() => { onChange(option.value); setOpen(false); }}>
              <span>{option.label}</span>{option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FocusView({ secondsLeft, isFocusing, focusTaskId, focusTask, tasks, focusMinutes, focusSessions, onFocusTask, onToggle, onReset }: { secondsLeft: number; isFocusing: boolean; focusTaskId: string; focusTask?: Task; tasks: Task[]; focusMinutes: number; focusSessions: number; onFocusTask: (id: string) => void; onToggle: () => void; onReset: () => void }) {
  const progress = ((focusSeconds - secondsLeft) / focusSeconds) * 100;
  return (
    <div className="focus-layout">
      <section className="focus-hero">

        <h2>给重要的事，一段完整的时间。</h2>
        <p>25 分钟内，暂时放下切换与干扰，只推进一件事。</p>
        <label className="focus-task-select">
          <span>本轮专注于</span>
          <AppSelect ariaLabel="选择本轮专注任务" value={focusTaskId} options={[{ value: '', label: '选择一个任务（可选）' }, ...tasks.map((task) => ({ value: task.id, label: task.title }))]} onChange={onFocusTask} />
        </label>
        {focusTask && <div className="focus-task-chip"><CheckSquare2 size={14} /> {focusTask.title}</div>}
      </section>
      <section className="timer-panel">
        <div className="timer-ring" style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}>
          <div className="timer-core"><span>{isFocusing ? '正在专注' : '准备开始'}</span><strong>{formatTimer(secondsLeft)}</strong><small>番茄时段 · 25 分钟</small></div>
        </div>
        <div className="timer-actions"><button type="button" className="dark-button large" onClick={onToggle}>{isFocusing ? '暂停计时' : '开始专注'} {isFocusing ? <Pause size={16} /> : <ArrowRight size={16} />}</button><button type="button" className="text-button" onClick={onReset}>重新开始</button></div>
      </section>
      <section className="focus-stats">
        <div><span>今日累计</span><strong>{focusMinutes}<small> 分钟</small></strong></div>
        <div><span>完成时段</span><strong>{focusSessions}<small> 个</small></strong></div>
        <div><span>下一次休息</span><strong>{isFocusing ? '专注后' : '随时'}<small>{isFocusing ? ' · 5 分钟' : ' · 由你决定'}</small></strong></div>
      </section>
    </div>
  );
}

export function BookmarksView({ bookmarks, showComposer, draft, onShowComposer, onHideComposer, onDraftChange, onAdd, onOpen, onDelete }: { bookmarks: Bookmark[]; showComposer: boolean; draft: { title: string; url: string; description: string }; onShowComposer: () => void; onHideComposer: () => void; onDraftChange: (draft: { title: string; url: string; description: string }) => void; onAdd: (event: FormEvent<HTMLFormElement>) => void; onOpen: (url: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="view-stack">
      <div className="bookmarks-intro">
        <div className="bookmarks-copy">
          <h2>常用工具</h2>
          <p>保存网站、文档库和日常工具，一次点击直达。</p>
        </div>
        <button type="button" className="secondary-button" onClick={onShowComposer}><Plus size={16} /> 添加入口</button>
      </div>
      {showComposer && (
        <form className="inline-composer" onSubmit={onAdd}>
          <label className="field"><span>名称</span><input autoFocus value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="例如：团队知识库" /></label>
          <label className="field"><span>网址</span><input value={draft.url} onChange={(event) => onDraftChange({ ...draft, url: event.target.value })} placeholder="https://…" /></label>
          <label className="field"><span>说明</span><input value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} placeholder="可选" /></label>
          <div className="inline-actions"><button type="button" className="text-button" onClick={onHideComposer}>取消</button><button type="submit" className="primary-button">保存入口</button></div>
        </form>
      )}
      <div className="bookmarks-grid">
        {bookmarks.map((bookmark) => (
          <article className="bookmark-card" key={bookmark.id} style={{ background: bookmark.color }}>
            <div className="bookmark-card-top"><span className="bookmark-icon"><ExternalLink size={16} /></span><button type="button" className="delete-button" aria-label={`删除 ${bookmark.title}`} onClick={() => onDelete(bookmark.id)}><X size={14} /></button></div>
            <h3>{bookmark.title}</h3><p>{bookmark.description}</p>
            <button type="button" className="open-link" onClick={() => onOpen(bookmark.url)}>打开链接 <ArrowRight size={14} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }: { icon: LucideIcon; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span><Icon size={20} strokeWidth={1.6} /></span><strong>{title}</strong><p>{description}</p>{action && <button type="button" className="secondary-button" onClick={onAction}>{action}</button>}</div>;
}
