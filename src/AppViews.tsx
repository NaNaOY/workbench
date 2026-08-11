import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Lightbulb,
  ListTodo,
  NotebookPen,
  Pause,
  Plus,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Bookmark, FocusRecord, LedgerEntry, Note, TodayTodo, TodoCollection } from './types';
import { FocusInsights } from './components/FocusInsights';
import { TodayTodoWorkspace } from './components/TodayTodoWorkspace';
import { focusBackgroundById } from './todo-config';
import { RichNoteEditor, noteTextPreview } from './components/NoteEditor';
import { AppSelect } from './components/AppSelect';

const BASE_URL = import.meta.env.BASE_URL;
const focusSeconds = 25 * 60;
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
  ledgerEntries,
  notes,
  focusMinutes,
  ledgerCompletionRate,
  todoCollections,
  todayTodos,
  focusRecords,
  selectedTodoCollectionId,
  onSelectTodoCollection,
  onAddTodayTodo,
  onToggleTodayTodo,
  onDeleteTodayTodo,
  onAddTodoCollection,
  onDeleteTodoCollection,
  onStartFocusTodo,
  onOpenLedger,
  onOpenNotes,
  onStartFocus,
}: {
  ledgerEntries: LedgerEntry[];
  notes: Note[];
  focusMinutes: number;
  ledgerCompletionRate: number;
  todoCollections: TodoCollection[];
  todayTodos: TodayTodo[];
  focusRecords: FocusRecord[];
  selectedTodoCollectionId: string;
  onSelectTodoCollection: (id: string) => void;
  onAddTodayTodo: (draft: { title: string; collectionId: string; backgroundId: string }) => void;
  onToggleTodayTodo: (id: string) => void;
  onDeleteTodayTodo: (id: string) => void;
  onAddTodoCollection: (name: string) => string;
  onDeleteTodoCollection: (id: string) => void;
  onStartFocusTodo: (todoId: string) => void;
  onOpenLedger: () => void;
  onOpenNotes: () => void;
  onStartFocus: () => void;
}) {
  const completedLedgerCount = ledgerEntries.filter((entry) => entry.status === 'completed').length;
  const activeTodoCount = todayTodos.filter((todo) => !todo.completed).length;
  const completedTodoCount = todayTodos.length - activeTodoCount;
  const minutesLabel = focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` : `${focusMinutes}m`;

  function scrollToTodayTodos() {
    document.getElementById('today-todo-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="dashboard-stack">
      <section className="metrics-grid">
        <MetricCard icon={ListTodo} tone="lavender" label="今日待办" value={String(activeTodoCount)} detail={activeTodoCount ? `${completedTodoCount} 条已经完成` : '今天的清单很轻盈'} action="整理待办" onClick={scrollToTodayTodos} />
        <MetricCard icon={CheckCircle2} tone="mint" label="个人台账" value={String(ledgerEntries.length)} detail={`${completedLedgerCount} 条已完成 · 完成率 ${ledgerCompletionRate}%`} action="查看台账" onClick={onOpenLedger} />
        <MetricCard icon={Timer} tone="peach" label="专注时间" value={minutesLabel} detail="今日待办累计投入" action="开始专注" onClick={onStartFocus} />
        <MetricCard icon={NotebookPen} tone="blue" label="灵感笔记" value={String(notes.length)} detail="随时记录，不让想法溜走" action="打开笔记" onClick={onOpenNotes} />
      </section>

      <TodayTodoWorkspace
        collections={todoCollections}
        todos={todayTodos}
        focusRecords={focusRecords}
        selectedCollectionId={selectedTodoCollectionId}
        onSelectCollection={onSelectTodoCollection}
        onAddTodo={onAddTodayTodo}
        onToggleTodo={onToggleTodayTodo}
        onDeleteTodo={onDeleteTodayTodo}
        onAddCollection={onAddTodoCollection}
        onDeleteCollection={onDeleteTodoCollection}
        onStartFocus={onStartFocusTodo}
      />

      <section className="lower-grid">
        <div className="panel notes-preview">
          <div className="panel-heading">
            <div><h2>最近记录</h2></div>
            <button type="button" className="text-button" onClick={onOpenNotes}>全部笔记 <ArrowRight size={14} /></button>
          </div>
          <div className="note-preview-grid">
            {notes.slice(0, 3).map((note) => (
              <button type="button" onClick={onOpenNotes} className="note-card" key={note.id} style={{ background: note.color }}>
                <strong>{note.title}</strong>
                <span>{noteTextPreview(note.content) || '点击开始记录…'}</span>
                <small>{relativeTime(note.updatedAt)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel quick-panel">
          <img className="quick-brand-orbit" src={`${BASE_URL}assets/brand-orbit.jpg`} alt="" aria-hidden="true" />
          <h2>给现在一个方向</h2>
          <p>从今日待办中选一件事，把接下来的 25 分钟只交给它。</p>
          <button type="button" className="dark-button" onClick={onStartFocus}>选择待办并开始 <ArrowRight size={16} /></button>
          <div className="quick-foot"><span className="pulse-dot" /> 待办与专注记录均保存在本地</div>
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

export function NotesView({ notes, selectedNote, selectedId, onSelect, onCreate, onUpdate, onDelete }: { notes: Note[]; selectedNote: Note | null; selectedId: string | null; onSelect: (id: string) => void; onCreate: () => void; onUpdate: (id: string, patch: Partial<Note>) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const visibleNotes = notes.filter((note) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return `${note.title} ${noteTextPreview(note.content)}`.toLowerCase().includes(keyword);
  });

  return (
    <div className="notes-layout notebook-layout">
      <aside className="notes-list-panel">
        <div className="notes-list-head">
          <div>
            <span className="notes-kicker">MY NOTEBOOK</span>
            <h2>灵感库</h2>
            <small>{notes.length} 篇本地笔记</small>
          </div>
          <button type="button" className="round-add" onClick={onCreate} aria-label="新建笔记"><Plus size={17} /></button>
        </div>
        <label className="notes-search">
          <span className="sr-only">搜索笔记</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或内容…" />
        </label>
        <div className="notes-section-label">我的笔记</div>
        <div className="notes-list">
          {visibleNotes.map((note) => (
            <button type="button" key={note.id} className={`note-list-item ${selectedId === note.id ? 'selected' : ''}`} onClick={() => onSelect(note.id)}>
              <span style={{ background: note.color }} />
              <div><strong>{note.title || '未命名笔记'}</strong><small>{noteTextPreview(note.content) || '空白笔记'} · {relativeTime(note.updatedAt)}</small></div>
            </button>
          ))}
          {!visibleNotes.length && <div className="notes-list-empty">没有匹配的笔记</div>}
        </div>
        <div className="notes-sidebar-foot"><span><i /> 本地自动保存</span><small>图片与内容随工作台一起保存</small></div>
      </aside>
      <section className="note-editor-panel">
        {selectedNote ? (
          <>
            <div className="note-editor-top">
              <div>
                <span className="note-breadcrumb">我的笔记 / {selectedNote.title || '未命名笔记'}</span>
                <span className="saved-indicator"><i /> 自动保存中</span>
              </div>
              <button type="button" className="text-button danger" onClick={() => onDelete(selectedNote.id)}>删除笔记</button>
            </div>
            <input className="note-title-input" value={selectedNote.title} onChange={(event) => onUpdate(selectedNote.id, { title: event.target.value })} placeholder="笔记标题" />
            <div className="note-meta"><span>最后更新于 {relativeTime(selectedNote.updatedAt)}</span><span>富文本笔记 · 支持图片</span></div>
            <RichNoteEditor
              key={selectedNote.id}
              noteId={selectedNote.id}
              value={selectedNote.content}
              onChange={(content) => onUpdate(selectedNote.id, { content })}
            />
          </>
        ) : (
          <EmptyState icon={Lightbulb} title="还没有笔记" description="记录正在酝酿的想法，未来的你会感谢现在的自己。" action="新建笔记" onAction={onCreate} />
        )}
      </section>
    </div>
  );
}

export function FocusView({
  secondsLeft,
  isFocusing,
  focusTodoId,
  focusTodo,
  todos,
  collections,
  focusMinutes,
  focusSessions,
  focusRecords,
  onFocusTodo,
  onToggle,
  onReset,
  onOpenTodos,
}: {
  secondsLeft: number;
  isFocusing: boolean;
  focusTodoId: string;
  focusTodo?: TodayTodo;
  todos: TodayTodo[];
  collections: TodoCollection[];
  focusMinutes: number;
  focusSessions: number;
  focusRecords: FocusRecord[];
  onFocusTodo: (id: string) => void;
  onToggle: () => void;
  onReset: () => void;
  onOpenTodos: () => void;
}) {
  const progress = ((focusSeconds - secondsLeft) / focusSeconds) * 100;
  const background = focusBackgroundById(focusTodo?.backgroundId);
  const collection = collections.find((item) => item.id === focusTodo?.collectionId);
  const heroStyle = {
    '--focus-accent': background.accent,
  } as CSSProperties;
  const canStart = Boolean(focusTodo) || isFocusing;

  return (
    <div className="focus-layout">
      <section key={focusTodo ? `${focusTodo.id}:${background.id}` : 'focus-empty'} className="focus-hero focus-hero--todo" style={heroStyle}>
        <img
          className="focus-hero-scene"
          src={background.src}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="focus-hero-content">
          <span className="focus-scene-label">
            <Clock3 size={14} />
            {focusTodo ? `${collection?.name ?? '今日待办'} · ${background.name}` : background.name}
          </span>
          <h2>{focusTodo?.title ?? '先从今日待办中选择一件事。'}</h2>
          <p>{focusTodo ? background.description : '专注模式只与今日待办联动，长期任务不会出现在这里。'}</p>
          <div className="focus-task-select">
            <span>本轮专注于</span>
            <AppSelect
              ariaLabel="选择本轮专注待办"
              value={focusTodoId}
              options={[{ value: '', label: '选择一条今日待办' }, ...todos.map((todo) => ({ value: todo.id, label: todo.title }))]}
              onChange={onFocusTodo}
            />
          </div>

          {!todos.length && <button type="button" className="focus-open-todos" onClick={onOpenTodos}>返回首页添加今日待办 <ArrowRight size={14} /></button>}
        </div>
      </section>
      <section className="timer-panel" style={{ '--focus-accent': background.accent } as CSSProperties}>
        <div className="timer-ring" style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}>
          <div className="timer-core"><span>{isFocusing ? '正在专注' : focusTodo ? '准备开始' : '等待选择'}</span><strong>{formatTimer(secondsLeft)}</strong><small>番茄时段 · 25 分钟</small></div>
        </div>
        <div className="timer-actions">
          <button type="button" className="dark-button large" disabled={!canStart} onClick={onToggle}>
            {isFocusing ? '暂停计时' : focusTodo ? '开始专注' : '请先选择待办'} {isFocusing ? <Pause size={16} /> : <ArrowRight size={16} />}
          </button>
          <button type="button" className="text-button" onClick={onReset}>重新开始</button>
        </div>
      </section>
      <section className="focus-stats">
        <div><span>今日累计</span><strong>{focusMinutes}<small> 分钟</small></strong></div>
        <div><span>完成时段</span><strong>{focusSessions}<small> 个</small></strong></div>
        <div><span>下一次休息</span><strong>{isFocusing ? '专注后' : '随时'}<small>{isFocusing ? ' · 5 分钟' : ' · 由你决定'}</small></strong></div>
      </section>
      <FocusInsights records={focusRecords} />
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
