import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  CircleCheck,
  Github,
  LayoutDashboard,
  Link2,
  ListTodo,
  NotebookPen,
  Plus,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react';
import { createId, loadWorkspace, localDateKey, saveWorkspace } from './data';
import { Bookmark, Note, Priority, Task, TaskStatus, WorkspaceData } from './types';
import { AppSelect, BookmarksView, DashboardView, FocusView, NotesView, TasksView } from './AppViews';
import { GitHubRankingView } from './KnowledgeViews';
import DailyCognitionView from './DailyCognitionView';

type View = 'dashboard' | 'growth' | 'github' | 'tasks' | 'notes' | 'focus' | 'bookmarks';

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: 'growth', label: '每日认知', icon: BrainCircuit },
  { id: 'github', label: 'GitHub 干货榜', icon: Github },
  { id: 'dashboard', label: '工作总览', icon: LayoutDashboard },
  { id: 'tasks', label: '任务管理', icon: ListTodo },
  { id: 'notes', label: '灵感笔记', icon: NotebookPen },
  { id: 'focus', label: '专注模式', icon: Timer },
  { id: 'bookmarks', label: '快捷入口', icon: Link2 },
];

const focusSeconds = 25 * 60;

function isoToday() {
  return localDateKey();
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function GlobalClickEffect() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const createEffect = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || reducedMotion.matches) return;

      const effect = document.createElement('span');
      effect.className = 'global-click-effect';
      effect.style.left = `${event.clientX}px`;
      effect.style.top = `${event.clientY}px`;
      effect.setAttribute('aria-hidden', 'true');

      for (let index = 0; index < 6; index += 1) {
        const spark = document.createElement('i');
        spark.style.setProperty('--spark-angle', `${index * 60}deg`);
        spark.style.setProperty('--spark-delay', `${index * 8}ms`);
        effect.appendChild(spark);
      }

      document.body.appendChild(effect);
      window.setTimeout(() => effect.remove(), 680);
    };

    window.addEventListener('pointerdown', createEffect, { passive: true });
    return () => window.removeEventListener('pointerdown', createEffect);
  }, []);

  return null;
}

const BASE_URL = import.meta.env.BASE_URL;

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace());
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => loadWorkspace().notes[0]?.id ?? null);
  const [taskDraft, setTaskDraft] = useState({ title: '', priority: 'medium' as Priority, project: '收件箱', due: isoToday() });
  const [bookmarkDraft, setBookmarkDraft] = useState({ title: '', url: '', description: '' });
  const [showBookmarkComposer, setShowBookmarkComposer] = useState(false);
  const [toast, setToast] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(focusSeconds);
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState('');
  const [storagePath, setStoragePath] = useState('');

  const isDesktop = Boolean(window.desktop?.isDesktop);

  useEffect(() => {
    if (!window.desktop?.getStoragePath) return;
    void window.desktop.getStoragePath().then(setStoragePath);
  }, []);

  useEffect(() => {
    saveWorkspace(workspace);
    window.desktop?.persistStorage?.();
  }, [workspace]);

  useEffect(() => {
    const resetFocusStatsAfterDayChange = () => {
      const today = localDateKey();
      setWorkspace((data) => data.focusDate === today
        ? data
        : {
          ...data,
          focusDate: today,
          focusMinutes: 0,
          focusSessions: 0,
        });
    };
    resetFocusStatsAfterDayChange();
    const timer = window.setInterval(resetFocusStatsAfterDayChange, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowTaskComposer(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isFocusing) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsFocusing(false);
          setWorkspace((data) => {
            const today = localDateKey();
            const existingMinutes = data.focusDate === today ? data.focusMinutes : 0;
            const existingSessions = data.focusDate === today ? data.focusSessions : 0;
            return {
              ...data,
              focusDate: today,
              focusMinutes: existingMinutes + 25,
              focusSessions: existingSessions + 1,
            };
          });
          notify('一个专注时段已完成，做得漂亮。');
          return focusSeconds;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFocusing]);

  const today = isoToday();
  const activeTasks = workspace.tasks.filter((task) => task.status !== 'done');
  const dueToday = activeTasks.filter((task) => task.due === today);
  const overdue = activeTasks.filter((task) => task.due && task.due < today);
  const doneTasks = workspace.tasks.filter((task) => task.status === 'done');
  const completionRate = workspace.tasks.length ? Math.round((doneTasks.length / workspace.tasks.length) * 100) : 0;
  const selectedNote = workspace.notes.find((note) => note.id === selectedNoteId) ?? workspace.notes[0] ?? null;
  const focusTask = workspace.tasks.find((task) => task.id === focusTaskId);

  const taskGroups = useMemo(
    () => [
      { status: 'todo' as TaskStatus, title: '待处理', hint: '下一步可推进的事项' },
      { status: 'doing' as TaskStatus, title: '进行中', hint: '正在投入注意力的任务' },
      { status: 'done' as TaskStatus, title: '已完成', hint: '已完成的成果' },
    ],
    [],
  );

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskDraft.title.trim();
    if (!title) return;
    const task: Task = {
      id: createId('task'),
      title,
      status: 'todo',
      priority: taskDraft.priority,
      project: taskDraft.project.trim() || '收件箱',
      due: taskDraft.due,
    };
    setWorkspace((data) => ({ ...data, tasks: [task, ...data.tasks] }));
    setTaskDraft({ title: '', priority: 'medium', project: '收件箱', due: today });
    setShowTaskComposer(false);
    setActiveView('tasks');
    notify('任务已加入工作台。');
  }

  function updateTask(id: string, patch: Partial<Task>) {
    setWorkspace((data) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    }));
  }

  function deleteTask(id: string) {
    setWorkspace((data) => ({ ...data, tasks: data.tasks.filter((task) => task.id !== id) }));
    notify('任务已移除。');
  }

  function createNote() {
    const note: Note = {
      id: createId('note'),
      title: '未命名笔记',
      content: '',
      updatedAt: new Date().toISOString(),
      color: '#e8eeff',
    };
    setWorkspace((data) => ({ ...data, notes: [note, ...data.notes] }));
    setSelectedNoteId(note.id);
  }

  function updateNote(id: string, patch: Partial<Note>) {
    setWorkspace((data) => ({
      ...data,
      notes: data.notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note)),
    }));
  }

  function deleteNote(id: string) {
    setWorkspace((data) => {
      const notes = data.notes.filter((note) => note.id !== id);
      setSelectedNoteId(notes[0]?.id ?? null);
      return { ...data, notes };
    });
  }

  function addBookmark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = bookmarkDraft.title.trim();
    const rawUrl = bookmarkDraft.url.trim();
    if (!title || !rawUrl) return;
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const colors = ['#e7f6ed', '#fff0dd', '#e8eeff', '#f3ebff', '#e5f6f4'];
    const bookmark: Bookmark = {
      id: createId('link'),
      title,
      url,
      description: bookmarkDraft.description.trim() || '快捷访问',
      color: colors[workspace.bookmarks.length % colors.length],
    };
    setWorkspace((data) => ({ ...data, bookmarks: [...data.bookmarks, bookmark] }));
    setBookmarkDraft({ title: '', url: '', description: '' });
    setShowBookmarkComposer(false);
    notify('快捷入口已添加。');
  }

  function openBookmark(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function renderView() {
    switch (activeView) {
      case 'growth':
        return <DailyCognitionView />;
      case 'github':
        return <GitHubRankingView />;
      case 'tasks':
        return (
          <TasksView
            taskGroups={taskGroups}
            tasks={workspace.tasks}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAdd={() => setShowTaskComposer(true)}
          />
        );
      case 'notes':
        return (
          <NotesView
            notes={workspace.notes}
            selectedNote={selectedNote}
            selectedId={selectedNoteId}
            onSelect={setSelectedNoteId}
            onCreate={createNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        );
      case 'focus':
        return (
          <FocusView
            secondsLeft={secondsLeft}
            isFocusing={isFocusing}
            focusTaskId={focusTaskId}
            focusTask={focusTask}
            tasks={activeTasks}
            focusMinutes={workspace.focusMinutes}
            focusSessions={workspace.focusSessions}
            onFocusTask={setFocusTaskId}
            onToggle={() => setIsFocusing((running) => !running)}
            onReset={() => {
              setIsFocusing(false);
              setSecondsLeft(focusSeconds);
            }}
          />
        );
      case 'bookmarks':
        return (
          <BookmarksView
            bookmarks={workspace.bookmarks}
            showComposer={showBookmarkComposer}
            draft={bookmarkDraft}
            onShowComposer={() => setShowBookmarkComposer(true)}
            onHideComposer={() => setShowBookmarkComposer(false)}
            onDraftChange={setBookmarkDraft}
            onAdd={addBookmark}
            onOpen={openBookmark}
            onDelete={(id) => setWorkspace((data) => ({ ...data, bookmarks: data.bookmarks.filter((link) => link.id !== id) }))}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardView
            tasks={workspace.tasks}
            notes={workspace.notes}
            focusMinutes={workspace.focusMinutes}
            completionRate={completionRate}
            dueToday={dueToday}
            overdue={overdue}
            onTaskDone={(id) => updateTask(id, { status: 'done' })}
            onOpenTasks={() => setActiveView('tasks')}
            onOpenNotes={() => setActiveView('notes')}
            onStartFocus={() => setActiveView('focus')}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <GlobalClickEffect />
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src={`${BASE_URL}assets/workbench-icon.png`} alt="WorkBench" /></div>
          <div>
            <strong>WorkBench</strong>
            <span>个人工作台</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主要导航">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon"><item.icon size={17} strokeWidth={1.8} /></span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="local-status" title={storagePath || undefined}><span /> {isDesktop ? '本地文件 · 已保存' : '浏览器存储 · 已保存'}</div>
          <p>{isDesktop ? '任务、笔记与内容缓存保存在本机文件，不受浏览器清理影响。' : '网页版本保存在当前浏览器；桌面版会写入本机文件。'}</p>
        </div>
      </aside>

      <section className={`workspace workspace--${activeView}`}>
        <header className="topbar">
          <div>
            <div className="eyebrow">{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</div>
            <h1>{activeView === 'dashboard' ? `${greeting()}，今天想完成什么？` : navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <div className="profile-chip" title="我的工作台">
              <img src={`${BASE_URL}assets/cozy-duck.jpg`} alt="我的头像" />
              <span><strong>我的空间</strong><small>本地工作台</small></span>
            </div>
            <div className="shortcut-hint"><kbd>Ctrl</kbd><span>+</span><kbd>N</kbd><span>新建任务</span></div>
            <button type="button" className="primary-button" onClick={() => setShowTaskComposer(true)}>
              <Plus size={16} aria-hidden="true" /> 新建任务
            </button>
          </div>
        </header>

        <main className="content">{renderView()}</main>
      </section>

      {showTaskComposer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowTaskComposer(false)}>
          <form className="task-composer" onSubmit={addTask} onMouseDown={(event) => event.stopPropagation()}>
            <div className="composer-heading">
              <div>
                <span className="eyebrow">快速收集</span>
                <h2>添加一件要事</h2>
              </div>
              <button type="button" className="icon-button" aria-label="关闭" onClick={() => setShowTaskComposer(false)}><X size={18} /></button>
            </div>
            <label className="field full-field">
              <span>任务内容</span>
              <input autoFocus value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} placeholder="例如：整理客户反馈并确定下一步" />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>优先级</span>
                <AppSelect ariaLabel="选择任务优先级" value={taskDraft.priority} options={[{ value: 'high', label: '高优先级' }, { value: 'medium', label: '中优先级' }, { value: 'low', label: '低优先级' }]} onChange={(value) => setTaskDraft({ ...taskDraft, priority: value as Priority })} />
              </label>
              <label className="field">
                <span>截止日期</span>
                <input type="date" value={taskDraft.due} onChange={(event) => setTaskDraft({ ...taskDraft, due: event.target.value })} />
              </label>
            </div>
            <label className="field full-field">
              <span>项目 / 场景</span>
              <input value={taskDraft.project} onChange={(event) => setTaskDraft({ ...taskDraft, project: event.target.value })} placeholder="收件箱" />
            </label>
            <div className="composer-actions">
              <button type="button" className="text-button" onClick={() => setShowTaskComposer(false)}>取消</button>
              <button type="submit" className="primary-button">加入任务清单</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast"><CircleCheck size={18} aria-hidden="true" /> {toast}</div>}
    </div>
  );
}
