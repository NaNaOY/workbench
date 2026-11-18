import { FormEvent, useEffect, useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  ChartCandlestick,
  CircleCheck,
  Github,
  LayoutDashboard,
  Link2,
  ClipboardList,
  NotebookPen,
  Plus,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { createId, loadWorkspace, localDateKey, saveWorkspace } from './data';
import { Bookmark, LedgerCategory, LedgerEntry, Note, Problem, TodayTodo, WorkspaceData } from './types';
import { TODO_COLLECTION_COLORS } from './todo-config';
import { BookmarksView, DashboardView, FocusView, NotesView } from './AppViews';
import { GitHubRankingView } from './KnowledgeViews';
import { ProblemsView } from './components/ProblemsView';
import DailyCognitionView from './DailyCognitionView';
import { LedgerView } from './components/LedgerView';
import { FuturesView } from './components/FuturesView';

type View = 'dashboard' | 'growth' | 'github' | 'futures' | 'ledger' | 'notes' | 'focus' | 'bookmarks' | 'problems';

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: 'growth', label: '每日认知', icon: BrainCircuit },
  { id: 'github', label: 'GitHub 干货榜', icon: Github },
  { id: 'futures', label: '期货面板', icon: ChartCandlestick },
  { id: 'dashboard', label: '工作总览', icon: LayoutDashboard },
  { id: 'ledger', label: '个人台账', icon: ClipboardList },
  { id: 'notes', label: '灵感笔记', icon: NotebookPen },
  { id: 'problems', label: '信息学题单', icon: BookOpen },
  { id: 'focus', label: '专注模式', icon: Timer },
  { id: 'bookmarks', label: '快捷入口', icon: Link2 },
];

const focusSeconds = 25 * 60;

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
  const [ledgerCreateRequest, setLedgerCreateRequest] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => loadWorkspace().notes[0]?.id ?? null);
  const [bookmarkDraft, setBookmarkDraft] = useState({ title: '', url: '', description: '' });
  const [showBookmarkComposer, setShowBookmarkComposer] = useState(false);
  const [toast, setToast] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(focusSeconds);
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTodoId, setFocusTodoId] = useState('');
  const [selectedTodoCollectionId, setSelectedTodoCollectionId] = useState(() => loadWorkspace().todoCollections[0]?.id ?? '');
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
    if (workspace.todoCollections.some((collection) => collection.id === selectedTodoCollectionId)) return;
    setSelectedTodoCollectionId(workspace.todoCollections[0]?.id ?? '');
  }, [selectedTodoCollectionId, workspace.todoCollections]);

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
        setActiveView('ledger');
        setLedgerCreateRequest((request) => request + 1);
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
            const completedAt = new Date();
            const today = localDateKey(completedAt);
            const existingMinutes = data.focusDate === today ? data.focusMinutes : 0;
            const existingSessions = data.focusDate === today ? data.focusSessions : 0;
            const todo = data.todayTodos.find((item) => item.id === focusTodoId);
            const collection = data.todoCollections.find((item) => item.id === todo?.collectionId);
            return {
              ...data,
              focusDate: today,
              focusMinutes: existingMinutes + 25,
              focusSessions: existingSessions + 1,
              focusRecords: [...data.focusRecords, {
                id: createId('focus'),
                date: today,
                completedAt: completedAt.toISOString(),
                minutes: 25,
                sessions: 1,
                todoId: todo?.id,
                collectionId: collection?.id,
                backgroundId: todo?.backgroundId,
                taskTitle: todo?.title ?? '今日待办',
                project: collection?.name ?? '未分类',
              }],
            };
          });
          notify('一个专注时段已完成，做得漂亮。');
          return focusSeconds;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFocusing, focusTodoId]);

  const completedLedgerEntries = workspace.ledgerEntries.filter((entry) => entry.status === 'completed');
  const ledgerCompletionRate = workspace.ledgerEntries.length ? Math.round((completedLedgerEntries.length / workspace.ledgerEntries.length) * 100) : 0;
  const selectedNote = workspace.notes.find((note) => note.id === selectedNoteId) ?? workspace.notes[0] ?? null;
  const focusTodo = workspace.todayTodos.find((todo) => todo.id === focusTodoId);
  const focusTodos = workspace.todayTodos.filter((todo) => !todo.completed || todo.id === focusTodoId);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  function openLedgerComposer() {
    setActiveView('ledger');
    setLedgerCreateRequest((request) => request + 1);
  }

  function addLedgerCategory(name: string, color: string) {
    const id = createId('ledger-category');
    const category: LedgerCategory = { id, name, color, createdAt: new Date().toISOString() };
    setWorkspace((data) => ({ ...data, ledgerCategories: [...data.ledgerCategories, category] }));
    notify('新的台账分类已创建。');
    return id;
  }

  function renameLedgerCategory(id: string, name: string) {
    setWorkspace((data) => ({
      ...data,
      ledgerCategories: data.ledgerCategories.map((category) => category.id === id ? { ...category, name } : category),
    }));
    notify('台账分类已重命名。');
  }

  function deleteLedgerCategory(id: string) {
    if (workspace.ledgerCategories.length <= 1) return;
    const category = workspace.ledgerCategories.find((item) => item.id === id);
    if (!window.confirm(`删除“${category?.name ?? '该分类'}”？其中的记录将移动到其他台账。`)) return;
    const fallbackId = workspace.ledgerCategories.find((item) => item.id !== id)?.id;
    if (!fallbackId) return;
    setWorkspace((data) => ({
      ...data,
      ledgerCategories: data.ledgerCategories.filter((item) => item.id !== id),
      ledgerEntries: data.ledgerEntries.map((entry) => entry.categoryId === id ? { ...entry, categoryId: fallbackId, updatedAt: new Date().toISOString() } : entry),
    }));
    notify('台账分类已删除，原记录已安全迁移。');
  }

  function addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const nextEntry: LedgerEntry = { ...entry, id: createId('ledger-entry'), createdAt: now, updatedAt: now };
    setWorkspace((data) => ({ ...data, ledgerEntries: [nextEntry, ...data.ledgerEntries] }));
    notify('台账记录已保存。');
  }

  function updateLedgerEntry(id: string, patch: Partial<LedgerEntry>) {
    setWorkspace((data) => ({
      ...data,
      ledgerEntries: data.ledgerEntries.map((entry) => entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry),
    }));
    notify('台账记录已更新。');
  }

  function deleteLedgerEntry(id: string) {
    const entry = workspace.ledgerEntries.find((item) => item.id === id);
    if (!window.confirm(`确定删除“${entry?.title ?? '这条记录'}”？`)) return;
    setWorkspace((data) => ({ ...data, ledgerEntries: data.ledgerEntries.filter((item) => item.id !== id) }));
    notify('台账记录已删除。');
  }
  function addTodayTodo(draft: { title: string; collectionId: string; backgroundId: string }) {
    const todo: TodayTodo = {
      id: createId('today-todo'),
      title: draft.title,
      collectionId: draft.collectionId,
      backgroundId: draft.backgroundId,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setWorkspace((data) => ({ ...data, todayTodos: [todo, ...data.todayTodos] }));
    notify('待办已加入当前待办集。');
  }

  function toggleTodayTodo(id: string) {
    const current = workspace.todayTodos.find((todo) => todo.id === id);
    const completing = current ? !current.completed : false;
    setWorkspace((data) => ({
      ...data,
      todayTodos: data.todayTodos.map((todo) => todo.id === id
        ? { ...todo, completed: !todo.completed, completedAt: todo.completed ? undefined : new Date().toISOString() }
        : todo),
    }));
    if (completing && focusTodoId === id && !isFocusing) setFocusTodoId('');
    notify(completing ? '待办已完成。' : '待办已恢复。');
  }

  function deleteTodayTodo(id: string) {
    setWorkspace((data) => ({ ...data, todayTodos: data.todayTodos.filter((todo) => todo.id !== id) }));
    if (focusTodoId === id) {
      setFocusTodoId('');
      setIsFocusing(false);
      setSecondsLeft(focusSeconds);
    }
    notify('待办已删除。');
  }

  function addTodoCollection(name: string) {
    const id = createId('todo-set');
    const color = TODO_COLLECTION_COLORS[workspace.todoCollections.length % TODO_COLLECTION_COLORS.length];
    setWorkspace((data) => ({
      ...data,
      todoCollections: [...data.todoCollections, { id, name, color, createdAt: new Date().toISOString() }],
    }));
    setSelectedTodoCollectionId(id);
    notify('新的待办集已建立。');
    return id;
  }

  function deleteTodoCollection(id: string) {
    const remaining = workspace.todoCollections.filter((collection) => collection.id !== id);
    if (!remaining.length) return;
    const fallbackId = remaining[0].id;
    setWorkspace((data) => ({
      ...data,
      todoCollections: data.todoCollections.filter((collection) => collection.id !== id),
      todayTodos: data.todayTodos.map((todo) => todo.collectionId === id ? { ...todo, collectionId: fallbackId } : todo),
    }));
    if (selectedTodoCollectionId === id) setSelectedTodoCollectionId(fallbackId);
    notify('待办集已删除，其中的待办已移动到其他目录。');
  }

  function startFocusForTodo(todoId: string) {
    setFocusTodoId(todoId);
    setIsFocusing(false);
    setSecondsLeft(focusSeconds);
    setActiveView('focus');
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

  function addProblem(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newProblem: Problem = {
      ...problem,
      id: createId('problem'),
      createdAt: now,
      updatedAt: now,
    };
    setWorkspace((data) => ({ ...data, problems: [newProblem, ...data.problems] }));
    notify('题目已加入题库。');
  }

  function updateProblem(id: string, patch: Partial<Problem>) {
    setWorkspace((data) => ({
      ...data,
      problems: data.problems.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    }));
  }

  function deleteProblem(id: string) {
    setWorkspace((data) => ({ ...data, problems: data.problems.filter((p) => p.id !== id) }));
    notify('题目已移除。');
  }

  function renderView() {
    switch (activeView) {
      case 'growth':
        return <DailyCognitionView />;
      case 'github':
        return <GitHubRankingView />;
      case 'futures':
        return <FuturesView />;
      case 'ledger':
        return (
          <LedgerView
            categories={workspace.ledgerCategories}
            entries={workspace.ledgerEntries}
            createRequest={ledgerCreateRequest}
            onAddCategory={addLedgerCategory}
            onRenameCategory={renameLedgerCategory}
            onDeleteCategory={deleteLedgerCategory}
            onAddEntry={addLedgerEntry}
            onUpdateEntry={updateLedgerEntry}
            onDeleteEntry={deleteLedgerEntry}
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
            focusTodoId={focusTodoId}
            focusTodo={focusTodo}
            todos={focusTodos}
            collections={workspace.todoCollections}
            focusMinutes={workspace.focusMinutes}
            focusSessions={workspace.focusSessions}
            focusRecords={workspace.focusRecords}
            onFocusTodo={(id) => {
              if (isFocusing) {
                notify('请先暂停当前专注，再切换待办。');
                return;
              }
              setFocusTodoId(id);
              setSecondsLeft(focusSeconds);
            }}
            onToggle={() => {
              if (!focusTodo) {
                notify('请先选择一条今日待办。');
                return;
              }
              setIsFocusing((running) => !running);
            }}
            onReset={() => {
              setIsFocusing(false);
              setSecondsLeft(focusSeconds);
            }}
            onOpenTodos={() => {
              setActiveView('dashboard');
              window.setTimeout(() => document.getElementById('today-todo-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
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
      case 'problems':
        return (
          <ProblemsView
            problems={workspace.problems}
            onAdd={addProblem}
            onUpdate={updateProblem}
            onDelete={deleteProblem}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardView
            ledgerEntries={workspace.ledgerEntries}
            notes={workspace.notes}
            focusMinutes={workspace.focusMinutes}
            ledgerCompletionRate={ledgerCompletionRate}
            todoCollections={workspace.todoCollections}
            todayTodos={workspace.todayTodos}
            focusRecords={workspace.focusRecords}
            selectedTodoCollectionId={selectedTodoCollectionId}
            onSelectTodoCollection={setSelectedTodoCollectionId}
            onAddTodayTodo={addTodayTodo}
            onToggleTodayTodo={toggleTodayTodo}
            onDeleteTodayTodo={deleteTodayTodo}
            onAddTodoCollection={addTodoCollection}
            onDeleteTodoCollection={deleteTodoCollection}
            onStartFocusTodo={startFocusForTodo}
            onOpenLedger={() => setActiveView('ledger')}
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
          <p>{isDesktop ? '台账、待办、笔记与内容缓存保存在本机文件，不受浏览器清理影响。' : '网页版本保存在当前浏览器；桌面版会写入本机文件。'}</p>
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
            <div className="shortcut-hint"><kbd>Ctrl</kbd><span>+</span><kbd>N</kbd><span>新建记录</span></div>
            <button type="button" className="primary-button" onClick={openLedgerComposer}>
              <Plus size={16} aria-hidden="true" /> 新建记录
            </button>
          </div>
        </header>

        <main className="content">{renderView()}</main>
      </section>

      {toast && <div className="toast"><CircleCheck size={18} aria-hidden="true" /> {toast}</div>}
    </div>
  );
}
