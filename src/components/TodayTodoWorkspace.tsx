import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3,
  Check,
  CirclePlus,
  Clock3,
  FolderPlus,
  Layers3,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AppSelect } from './AppSelect';
import { TodoFocusDistribution } from './TodoFocusDistribution';
import { FOCUS_BACKGROUNDS, focusBackgroundById } from '../todo-config';
import type { FocusRecord, TodayTodo, TodoCollection } from '../types';

interface TodoDraft {
  title: string;
  collectionId: string;
  backgroundId: string;
}

interface TodayTodoWorkspaceProps {
  collections: TodoCollection[];
  todos: TodayTodo[];
  focusRecords: FocusRecord[];
  selectedCollectionId: string;
  onSelectCollection: (id: string) => void;
  onAddTodo: (draft: TodoDraft) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onAddCollection: (name: string) => string;
  onDeleteCollection: (id: string) => void;
  onStartFocus: (todoId: string) => void;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T12:00:00`));
}

function buildHeatmapDays() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const mondayIndex = (today.getDay() + 6) % 7;
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - mondayIndex));
  const start = new Date(end);
  start.setDate(end.getDate() - 111);
  return Array.from({ length: 112 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: localDateKey(date), date };
  });
}

function todoLevel(score: number) {
  if (score <= 0) return 0;
  if (score === 1) return 1;
  if (score === 2) return 2;
  if (score <= 4) return 3;
  return 4;
}

export function TodayTodoWorkspace(props: TodayTodoWorkspaceProps) {
  const {
    collections,
    todos,
    focusRecords,
    selectedCollectionId,
    onSelectCollection,
    onAddTodo,
    onToggleTodo,
    onDeleteTodo,
    onAddCollection,
    onDeleteCollection,
    onStartFocus,
  } = props;
  const [showTodoComposer, setShowTodoComposer] = useState(false);
  const [showCollectionComposer, setShowCollectionComposer] = useState(false);
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [statsScope, setStatsScope] = useState<string | null>(null);
  const [todoDraft, setTodoDraft] = useState({ title: '', backgroundId: FOCUS_BACKGROUNDS[0].id });
  const [collectionDraft, setCollectionDraft] = useState('');
  const statsMenuRef = useRef<HTMLDivElement>(null);

  const activeCollection = collections.find((collection) => collection.id === selectedCollectionId) ?? collections[0];
  const collectionTodos = useMemo(
    () => todos
      .filter((todo) => todo.collectionId === activeCollection?.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt)),
    [activeCollection?.id, todos],
  );
  const completedCount = collectionTodos.filter((todo) => todo.completed).length;

  useEffect(() => {
    if (!activeCollection && collections[0]) onSelectCollection(collections[0].id);
  }, [activeCollection, collections, onSelectCollection]);

  useEffect(() => {
    if (!showStatsMenu) return;
    const closeMenu = (event: PointerEvent) => {
      if (!statsMenuRef.current?.contains(event.target as Node)) setShowStatsMenu(false);
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, [showStatsMenu]);

  function submitTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = todoDraft.title.trim();
    if (!title || !activeCollection) return;
    onAddTodo({ title, collectionId: activeCollection.id, backgroundId: todoDraft.backgroundId });
    setTodoDraft({ title: '', backgroundId: todoDraft.backgroundId });
    setShowTodoComposer(false);
  }

  function submitCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = collectionDraft.trim();
    if (!name) return;
    const id = onAddCollection(name);
    onSelectCollection(id);
    setCollectionDraft('');
    setShowCollectionComposer(false);
  }

  function confirmDeleteCollection(collection: TodoCollection) {
    const count = todos.filter((todo) => todo.collectionId === collection.id).length;
    const message = count
      ? `删除“${collection.name}”后，其中 ${count} 条待办会移动到其他待办集。继续吗？`
      : `确定删除待办集“${collection.name}”吗？`;
    if (window.confirm(message)) onDeleteCollection(collection.id);
  }

  return (
    <section className="today-workspace-grid" id="today-todo-workspace" aria-label="今日待办与待办集">
      <article className="panel today-todo-panel">
        <header className="today-panel-heading">
          <div>
            <span className="today-panel-kicker">今日待办</span>
            <h2>{activeCollection?.name ?? '我的待办'}</h2>
            <p>{collectionTodos.length - completedCount} 条待推进 · {completedCount} 条已完成</p>
          </div>
          <button type="button" className="secondary-button compact-button" onClick={() => setShowTodoComposer((visible) => !visible)}>
            <Plus size={16} /> 添加待办
          </button>
        </header>

        {showTodoComposer && activeCollection && (
          <form className="today-todo-composer" onSubmit={submitTodo}>
            <label>
              <span>待办内容</span>
              <input autoFocus value={todoDraft.title} onChange={(event) => setTodoDraft({ ...todoDraft, title: event.target.value })} placeholder="例如：完成课程第二章练习" />
            </label>
            <fieldset className="focus-background-picker">
              <legend>选择专注背景</legend>
              <div>
                {FOCUS_BACKGROUNDS.map((background) => (
                  <button
                    type="button"
                    key={background.id}
                    className={todoDraft.backgroundId === background.id ? 'selected' : ''}
                    aria-label={`选择${background.name}背景`}
                    aria-pressed={todoDraft.backgroundId === background.id}
                    onClick={() => setTodoDraft({ ...todoDraft, backgroundId: background.id })}
                  >
                    <img src={background.src} alt="" />
                    <span>{background.name}</span>
                    {todoDraft.backgroundId === background.id && <i><Check size={12} /></i>}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="today-composer-actions">
              <button type="button" className="text-button" onClick={() => setShowTodoComposer(false)}>取消</button>
              <button type="submit" className="primary-button">加入今日待办</button>
            </div>
          </form>
        )}

        <div className="today-todo-list" aria-live="polite">
          {collectionTodos.map((todo) => {
            const background = focusBackgroundById(todo.backgroundId);
            return (
              <article
                className={`today-todo-item ${todo.completed ? 'is-completed' : ''}`}
                key={todo.id}
                style={{
                  '--todo-scene': `url("${background.src}")`,
                  '--todo-accent': background.accent,
                } as CSSProperties}
              >
                <button
                  type="button"
                  className="today-todo-check"
                  aria-label={todo.completed ? `恢复待办 ${todo.title}` : `完成待办 ${todo.title}`}
                  aria-pressed={todo.completed}
                  onClick={() => onToggleTodo(todo.id)}
                >
                  {todo.completed && <Check size={14} />}
                </button>

                <div className="today-todo-copy">
                  <strong>{todo.title}</strong>
                  <span><Clock3 size={13} /> {background.name}</span>
                </div>
                <div className="today-todo-actions">
                  {!todo.completed && (
                    <button type="button" className="todo-start-button" onClick={() => onStartFocus(todo.id)} aria-label={`开始专注 ${todo.title}`}>
                      <Play size={14} fill="currentColor" /> 开始
                    </button>
                  )}
                  <button type="button" className="todo-delete-button" onClick={() => onDeleteTodo(todo.id)} aria-label={`删除待办 ${todo.title}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
          {!collectionTodos.length && (
            <div className="today-todo-empty">
              <span><CirclePlus size={22} /></span>
              <strong>这个待办集还是空的</strong>
              <p>先放进一件真正值得推进的事，再为它留出一段完整时间。</p>
              <button type="button" className="secondary-button" onClick={() => setShowTodoComposer(true)}>添加第一条待办</button>
            </div>
          )}
        </div>
      </article>

      <aside className="panel todo-collection-panel">
        <header className="collection-panel-heading">
          <div>
            <span className="today-panel-kicker">待办集</span>
            <h2>按场景整理</h2>
            <p>选择目录，左侧只显示对应待办。</p>
          </div>
          <div className="todo-stats-control" ref={statsMenuRef}>
            <button type="button" className="icon-button stats-button" aria-label="查看待办统计" aria-expanded={showStatsMenu} onClick={() => setShowStatsMenu((visible) => !visible)}>
              <BarChart3 size={17} />
            </button>
            {showStatsMenu && (
              <div className="todo-stats-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setStatsScope(activeCollection?.id ?? 'all'); setShowStatsMenu(false); }}>
                  <BarChart3 size={15} /><span><strong>当前待办集</strong><small>{activeCollection?.name ?? '当前目录'}</small></span>
                </button>
                <button type="button" role="menuitem" onClick={() => { setStatsScope('all'); setShowStatsMenu(false); }}>
                  <Layers3 size={15} /><span><strong>全部待办集</strong><small>查看整体投入与完成情况</small></span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="todo-collection-list" role="tablist" aria-label="待办集目录">
          {collections.map((collection) => {
            const items = todos.filter((todo) => todo.collectionId === collection.id);
            const complete = items.filter((todo) => todo.completed).length;
            const progress = items.length ? Math.round((complete / items.length) * 100) : 0;
            return (
              <div className={`todo-collection-row ${collection.id === activeCollection?.id ? 'active' : ''}`} key={collection.id}>
                <button type="button" role="tab" aria-selected={collection.id === activeCollection?.id} onClick={() => onSelectCollection(collection.id)}>
                  <i style={{ background: collection.color }} />
                  <span><strong>{collection.name}</strong><small>{items.length - complete} 待办 · {progress}% 完成</small></span>
                  <b>{items.length}</b>
                </button>
                {collections.length > 1 && (
                  <button type="button" className="collection-delete" onClick={() => confirmDeleteCollection(collection)} aria-label={`删除待办集 ${collection.name}`}>
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showCollectionComposer ? (
          <form className="collection-composer" onSubmit={submitCollection}>
            <input autoFocus value={collectionDraft} onChange={(event) => setCollectionDraft(event.target.value)} placeholder="新的待办集名称" />
            <button type="submit" className="icon-button" aria-label="保存待办集"><Check size={16} /></button>
            <button type="button" className="icon-button" aria-label="取消新建" onClick={() => setShowCollectionComposer(false)}><X size={16} /></button>
          </form>
        ) : (
          <button type="button" className="add-collection-button" onClick={() => setShowCollectionComposer(true)}><FolderPlus size={16} /> 新建待办集</button>
        )}
      </aside>

      {statsScope && (
        <TodoStatsModal
          scope={statsScope}
          collections={collections}
          todos={todos}
          focusRecords={focusRecords}
          onScopeChange={setStatsScope}
          onClose={() => setStatsScope(null)}
        />
      )}
    </section>
  );
}

function TodoStatsModal({
  scope,
  collections,
  todos,
  focusRecords,
  onScopeChange,
  onClose,
}: {
  scope: string;
  collections: TodoCollection[];
  todos: TodayTodo[];
  focusRecords: FocusRecord[];
  onScopeChange: (scope: string) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const selectedCollection = collections.find((collection) => collection.id === scope);
  const scopeName = scope === 'all' ? '全部待办集' : selectedCollection?.name ?? '当前待办集';
  const scopedTodos = scope === 'all' ? todos : todos.filter((todo) => todo.collectionId === scope);
  const scopedRecords = focusRecords.filter((record) => {
    if (scope === 'all') return Boolean(record.collectionId || record.todoId);
    return record.collectionId === scope || (!record.collectionId && record.project === selectedCollection?.name);
  });

  const heatmap = useMemo(() => {
    const days = buildHeatmapDays();
    return days.map((day) => {
      const completed = scopedTodos.filter((todo) => todo.completedAt && localDateKey(new Date(todo.completedAt)) === day.key).length;
      const records = scopedRecords.filter((record) => record.date === day.key);
      const minutes = records.reduce((sum, record) => sum + record.minutes, 0);
      const sessions = records.reduce((sum, record) => sum + record.sessions, 0);
      return { ...day, completed, minutes, sessions, score: completed + sessions };
    });
  }, [scopedRecords, scopedTodos]);

  const selectedDay = heatmap.find((day) => day.key === selectedDate) ?? heatmap[heatmap.length - 1];
  const completedTotal = scopedTodos.filter((todo) => todo.completed).length;
  const focusMinutes = scopedRecords.reduce((sum, record) => sum + record.minutes, 0);
  const activeDays = heatmap.filter((day) => day.score > 0).length;

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const modal = closeRef.current?.closest('.todo-stats-modal');
      const focusable = Array.from(modal?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="todo-stats-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="todo-stats-modal" role="dialog" aria-modal="true" aria-labelledby="todo-stats-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="today-panel-kicker">待办统计</span>
            <h2 id="todo-stats-title">把每天的投入变成可见的积累</h2>
          </div>
          <button type="button" className="icon-button" ref={closeRef} aria-label="关闭统计" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="todo-stats-toolbar">
          <div className="todo-stats-scope">
            <span>统计范围</span>
            <AppSelect
              ariaLabel="选择待办统计范围"
              value={scope}
              options={[{ value: 'all', label: '全部待办集' }, ...collections.map((collection) => ({ value: collection.id, label: collection.name }))]}
              onChange={onScopeChange}
            />
          </div>
          <p>当前查看：<strong>{scopeName}</strong></p>
        </div>

        <div className="todo-stats-summary">
          <div><span>待办完成</span><strong>{completedTotal}<small> / {scopedTodos.length}</small></strong></div>
          <div><span>累计专注</span><strong>{focusMinutes}<small> 分钟</small></strong></div>
          <div><span>活跃天数</span><strong>{activeDays}<small> / 112 天</small></strong></div>
        </div>

        <TodoFocusDistribution
          scope={scope}
          anchorDate={selectedDate}
          collections={collections}
          todos={scopedTodos}
          records={scopedRecords}
          onAnchorDateChange={setSelectedDate}
        />

        <div className="todo-heatmap-panel">
          <div className="todo-heatmap-heading">
            <div><strong>近 16 周热力图</strong><span>完成待办与专注时段都会增加当天强度</span></div>
            <div className="todo-heatmap-legend" aria-label="热力图强度：从少到多"><span>少</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}<span>多</span></div>
          </div>
          <div className="todo-heatmap-wrap">
            <div className="todo-heatmap-weekdays" aria-hidden="true"><span>一</span><span>三</span><span>五</span><span>日</span></div>
            <div className="todo-heatmap" role="grid" aria-label={`${scopeName}近16周活动热力图`}>
              {heatmap.map((day) => {
                const label = `${formatShortDate(day.key)}：完成 ${day.completed} 条，专注 ${day.minutes} 分钟，共 ${day.sessions} 个时段`;
                return (
                  <button
                    type="button"
                    role="gridcell"
                    key={day.key}
                    data-level={todoLevel(day.score)}
                    className={selectedDate === day.key ? 'selected' : ''}
                    aria-label={label}
                    title={label}
                    onClick={() => setSelectedDate(day.key)}
                  />
                );
              })}
            </div>
          </div>
          <div className="todo-selected-day">
            <div><span>当前日期</span><strong>{formatShortDate(selectedDay.key)}</strong></div>
            <div><span>完成待办</span><strong>{selectedDay.completed} 条</strong></div>
            <div><span>专注投入</span><strong>{selectedDay.minutes} 分钟 · {selectedDay.sessions} 个时段</strong></div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
