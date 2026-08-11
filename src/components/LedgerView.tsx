import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Folder,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AppSelect } from './AppSelect';
import { LedgerCategory, LedgerEntry, LedgerImportance, LedgerStatus } from '../types';
import { FOCUS_BACKGROUNDS, focusBackgroundById } from '../todo-config';

const CATEGORY_COLORS = ['#6674dc', '#56a47c', '#c98b45', '#4f8fb8', '#9a6fc0', '#c46f76'];
const STATUS_LABELS: Record<LedgerStatus, string> = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
  archived: '已归档',
};
const IMPORTANCE_LABELS: Record<LedgerImportance, string> = {
  high: '重要',
  medium: '常规',
  low: '低',
};

type LedgerDraft = {
  title: string;
  categoryId: string;
  backgroundId: string;
  date: string;
  status: LedgerStatus;
  importance: LedgerImportance;
  notes: string;
  tags: string;
  value: string;
  unit: string;
};

interface LedgerViewProps {
  categories: LedgerCategory[];
  entries: LedgerEntry[];
  createRequest: number;
  onAddCategory: (name: string, color: string) => string;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (id: string, patch: Partial<LedgerEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

function todayKey() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function defaultBackgroundId(categoryId: string) {
  if (categoryId === 'ledger-study') return 'forest-path';
  if (categoryId === 'ledger-daily') return 'dawn-lake';
  return 'alpine-night';
}

function blankDraft(categoryId: string): LedgerDraft {
  return {
    title: '',
    categoryId,
    backgroundId: defaultBackgroundId(categoryId),
    date: todayKey(),
    status: 'active',
    importance: 'medium',
    notes: '',
    tags: '',
    value: '',
    unit: '',
  };
}

function formatDate(value: string) {
  if (!value) return '未记录日期';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value + 'T12:00:00'));
}

function relativeTime(value: string) {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 2) return '刚刚';
  if (minutes < 60) return minutes + ' 分钟前';
  if (minutes < 1440) return Math.floor(minutes / 60) + ' 小时前';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function csvCell(value: unknown) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}

export function LedgerView({
  categories,
  entries,
  createRequest,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: LedgerViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LedgerStatus>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'updated'>('newest');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<LedgerDraft>(() => blankDraft(categories[0]?.id ?? ''));
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return entries
      .filter((entry) => selectedCategoryId === 'all' || entry.categoryId === selectedCategoryId)
      .filter((entry) => statusFilter === 'all' || entry.status === statusFilter)
      .filter((entry) => {
        const searchable = [
          entry.title,
          entry.notes,
          entry.tags.join(' '),
          categoryMap.get(entry.categoryId)?.name ?? '',
        ].join(' ').toLowerCase();
        return !keyword || searchable.includes(keyword);
      })
      .sort((left, right) => {
        if (sortOrder === 'updated') return right.updatedAt.localeCompare(left.updatedAt);
        if (sortOrder === 'oldest') return left.date.localeCompare(right.date);
        return right.date.localeCompare(left.date);
      });
  }, [categoryMap, entries, query, selectedCategoryId, sortOrder, statusFilter]);

  const monthCount = entries.filter((entry) => entry.date.startsWith(todayKey().slice(0, 7))).length;
  const activeCount = entries.filter((entry) => entry.status === 'active').length;
  const completedCount = entries.filter((entry) => entry.status === 'completed').length;

  function openCreate() {
    const categoryId = selectedCategoryId === 'all' ? categories[0]?.id ?? '' : selectedCategoryId;
    setEditingEntryId(null);
    setDraft(blankDraft(categoryId));
    setDrawerOpen(true);
  }

  function openEdit(entry: LedgerEntry) {
    setEditingEntryId(entry.id);
    setDraft({
      title: entry.title,
      categoryId: entry.categoryId,
      backgroundId: focusBackgroundById(entry.backgroundId).id,
      date: entry.date,
      status: entry.status,
      importance: entry.importance,
      notes: entry.notes,
      tags: entry.tags.join('，'),
      value: entry.value === undefined ? '' : String(entry.value),
      unit: entry.unit ?? '',
    });
    setDrawerOpen(true);
  }

  useEffect(() => {
    if (createRequest > 0) openCreate();
  }, [createRequest]);

  useEffect(() => {
    if (draft.categoryId && categories.some((category) => category.id === draft.categoryId)) return;
    const categoryId = categories[0]?.id ?? '';
    setDraft((current) => ({
      ...current,
      categoryId,
      backgroundId: defaultBackgroundId(categoryId),
    }));
  }, [categories, draft.categoryId]);

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.categoryId) return;
    const numericValue = draft.value.trim() === '' ? undefined : Number(draft.value);
    const payload = {
      title: draft.title.trim(),
      categoryId: draft.categoryId,
      backgroundId: draft.backgroundId,
      date: draft.date || todayKey(),
      status: draft.status,
      importance: draft.importance,
      notes: draft.notes.trim(),
      tags: draft.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean),
      value: numericValue !== undefined && Number.isFinite(numericValue) ? numericValue : undefined,
      unit: draft.unit.trim() || undefined,
    };
    if (editingEntryId) onUpdateEntry(editingEntryId, payload);
    else onAddEntry(payload);
    setDrawerOpen(false);
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    const id = onAddCategory(categoryName.trim(), categoryColor);
    setSelectedCategoryId(id);
    setCategoryName('');
    setAddingCategory(false);
  }

  function finishRename(id: string) {
    if (renameValue.trim()) onRenameCategory(id, renameValue.trim());
    setRenamingCategoryId(null);
  }

  function exportCsv() {
    const rows = filteredEntries.map((entry) => [
      entry.date,
      entry.title,
      categoryMap.get(entry.categoryId)?.name ?? '未分类',
      STATUS_LABELS[entry.status],
      IMPORTANCE_LABELS[entry.importance],
      entry.value ?? '',
      entry.unit ?? '',
      entry.tags.join(' / '),
      focusBackgroundById(entry.backgroundId).name,
      entry.notes,
      entry.updatedAt,
    ]);
    const header = ['日期', '记录事项', '台账分类', '状态', '重要程度', '数值', '单位', '标签', '卡片背景', '备注', '更新时间'];
    const csv = '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '个人台账-' + todayKey() + '.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ledger-view">
      <section className="ledger-summary" aria-label="台账概览">
        <div className="ledger-summary-copy">
          <span className="ledger-kicker">PERSONAL LEDGER</span>
          <h2>把发生过的事，沉淀成可查、可追踪的记录。</h2>
          <p>统一管理工作、学习与日常台账；记录过程、结果和关键数据。</p>
        </div>
        <div className="ledger-summary-grid">
          <article><Database size={16} /><span>全部记录</span><strong>{entries.length}</strong></article>
          <article><CalendarDays size={16} /><span>本月新增</span><strong>{monthCount}</strong></article>
          <article><FileText size={16} /><span>持续跟进</span><strong>{activeCount}</strong></article>
          <article><CheckCircle2 size={16} /><span>已完成</span><strong>{completedCount}</strong></article>
        </div>
      </section>

      <div className="ledger-layout">
        <aside className="ledger-categories" aria-label="台账分类">
          <div className="ledger-categories-head">
            <div><span>我的台账</span><small>{categories.length} 个分类</small></div>
            <button type="button" aria-label="新建台账分类" onClick={() => setAddingCategory(true)}><Plus size={16} /></button>
          </div>

          <div className="ledger-category-list">
            <button
              type="button"
              className={'ledger-category-item ' + (selectedCategoryId === 'all' ? 'active' : '')}
              onClick={() => setSelectedCategoryId('all')}
            >
              <i className="all"><Folder size={15} /></i>
              <span>全部记录</span>
              <b>{entries.length}</b>
            </button>

            {categories.map((category) => {
              const count = entries.filter((entry) => entry.categoryId === category.id).length;
              const isRenaming = renamingCategoryId === category.id;
              return (
                <div
                  className={'ledger-category-row ' + (selectedCategoryId === category.id ? 'active' : '')}
                  key={category.id}
                >
                  <button type="button" className="ledger-category-main" onClick={() => setSelectedCategoryId(category.id)}>
                    <i style={{ background: category.color }} />
                    <span>{category.name}</span>
                    <b>{count}</b>
                  </button>
                  <div className="ledger-category-actions">
                    <button
                      type="button"
                      aria-label={'重命名' + category.name}
                      onClick={() => {
                        setRenamingCategoryId(category.id);
                        setRenameValue(category.name);
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label={'删除' + category.name}
                      disabled={categories.length <= 1}
                      onClick={() => onDeleteCategory(category.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {isRenaming && (
                    <form
                      className="ledger-rename-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        finishRename(category.id);
                      }}
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => finishRename(category.id)}
                      />
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          {addingCategory && (
            <form className="ledger-category-form" onSubmit={submitCategory}>
              <div className="ledger-category-form-top">
                <strong>新建分类</strong>
                <button type="button" onClick={() => setAddingCategory(false)}><X size={14} /></button>
              </div>
              <input
                autoFocus
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="例如：健康台账"
              />
              <div className="ledger-color-options">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={categoryColor === color ? 'selected' : ''}
                    style={{ background: color }}
                    aria-label={'选择颜色 ' + color}
                    onClick={() => setCategoryColor(color)}
                  />
                ))}
              </div>
              <button type="submit" className="ledger-category-submit">创建分类</button>
            </form>
          )}

          <div className="ledger-sidebar-tip">
            <Archive size={14} />
            <span>所有台账数据均保存在本机</span>
          </div>
        </aside>

        <section className="ledger-register">
          <div className="ledger-toolbar">
            <label className="ledger-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索事项、标签或备注"
              />
            </label>
            <div className="ledger-filter-select">
              <AppSelect
                ariaLabel="筛选台账状态"
                value={statusFilter}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'active', label: '进行中' },
                  { value: 'completed', label: '已完成' },
                  { value: 'paused', label: '已暂停' },
                  { value: 'archived', label: '已归档' },
                ]}
                onChange={(value) => setStatusFilter(value as 'all' | LedgerStatus)}
              />
            </div>
            <div className="ledger-filter-select sort-select">
              <AppSelect
                ariaLabel="排序台账记录"
                value={sortOrder}
                options={[
                  { value: 'newest', label: '日期从新到旧' },
                  { value: 'oldest', label: '日期从旧到新' },
                  { value: 'updated', label: '最近更新' },
                ]}
                onChange={(value) => setSortOrder(value as typeof sortOrder)}
              />
            </div>
            <button
              type="button"
              className="secondary-button ledger-export"
              onClick={exportCsv}
              disabled={!filteredEntries.length}
            >
              <Download size={15} /> 导出
            </button>
            <button type="button" className="primary-button ledger-new-entry" onClick={openCreate}>
              <Plus size={16} /> 新建记录
            </button>
          </div>

          <div className="ledger-table-meta">
            <div>
              <span>{selectedCategoryId === 'all' ? '全部台账' : categoryMap.get(selectedCategoryId)?.name}</span>
              <small>场景化记录卡</small>
            </div>
            <small>共 {filteredEntries.length} 条 · 双击卡片可打开编辑</small>
          </div>

          <div className="ledger-card-scroll">
            <div className="ledger-entry-list" aria-live="polite">
              {filteredEntries.map((entry, index) => {
                const category = categoryMap.get(entry.categoryId);
                const background = focusBackgroundById(entry.backgroundId);
                const style = {
                  '--ledger-accent': background.accent,
                  '--ledger-category-color': category?.color ?? background.accent,
                } as CSSProperties;
                return (
                  <article
                    className={'ledger-entry-card importance-' + entry.importance}
                    key={entry.id}
                    style={style}
                    onDoubleClick={() => openEdit(entry)}
                    aria-label={entry.title}
                  >
                    <img
                      className="ledger-entry-card-image"
                      src={background.src}
                      alt=""
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                    <div className="ledger-entry-card-shade" aria-hidden="true" />

                    <div className="ledger-entry-card-main">
                      <div className="ledger-entry-card-top">
                        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                        <span className="ledger-card-category">
                          <i />
                          {category?.name ?? '未分类'}
                        </span>
                        <span className={'ledger-card-status status-' + entry.status}>
                          {STATUS_LABELS[entry.status]}
                        </span>
                      </div>

                      <h3>{entry.title}</h3>
                      <p>{entry.notes || '暂时没有补充说明，双击卡片即可继续记录。'}</p>

                      <div className="ledger-entry-card-foot">
                        <div className="ledger-tags">
                          {entry.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                        </div>
                        <span className="ledger-scene-label" title={background.description}>
                          <ImageIcon size={13} />
                          {background.name}
                        </span>
                      </div>
                    </div>

                    <aside className="ledger-entry-card-side">
                      <div className="ledger-entry-number">
                        <span>关键数值</span>
                        <strong>
                          {entry.value === undefined ? '—' : entry.value}
                          {entry.unit && <small>{entry.unit}</small>}
                        </strong>
                      </div>
                      <div className="ledger-entry-updated">
                        <span>最近更新</span>
                        <strong>{relativeTime(entry.updatedAt)}</strong>
                      </div>
                      <div className="ledger-card-actions">
                        <button type="button" aria-label={'编辑' + entry.title} onClick={() => openEdit(entry)}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" aria-label={'删除' + entry.title} onClick={() => onDeleteEntry(entry.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </aside>
                  </article>
                );
              })}
            </div>

            {filteredEntries.length === 0 && (
              <div className="ledger-empty">
                <Database size={25} />
                <strong>这里还没有匹配的记录</strong>
                <p>调整筛选条件，或新建一条带场景背景的台账记录。</p>
                <button type="button" className="secondary-button" onClick={openCreate}>
                  <Plus size={15} /> 新建记录
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {drawerOpen && (
        <div className="ledger-drawer-backdrop" role="presentation" onMouseDown={() => setDrawerOpen(false)}>
          <aside
            className="ledger-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={editingEntryId ? '编辑台账记录' : '新建台账记录'}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ledger-drawer-head">
              <div>
                <span>{editingEntryId ? 'EDIT RECORD' : 'NEW RECORD'}</span>
                <h2>{editingEntryId ? '编辑台账记录' : '记录一件值得追踪的事'}</h2>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setDrawerOpen(false)}><X size={18} /></button>
            </div>

            <form className="ledger-entry-form" onSubmit={submitEntry}>
              <label className="ledger-field full">
                <span>记录事项</span>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="例如：完成季度项目复盘"
                />
              </label>

              <fieldset className="ledger-background-picker">
                <legend>卡片背景</legend>
                <div>
                  {FOCUS_BACKGROUNDS.map((background) => (
                    <button
                      type="button"
                      key={background.id}
                      className={draft.backgroundId === background.id ? 'selected' : ''}
                      aria-label={'选择' + background.name + '背景'}
                      aria-pressed={draft.backgroundId === background.id}
                      onClick={() => setDraft({ ...draft, backgroundId: background.id })}
                    >
                      <img src={background.src} alt="" />
                      <span>{background.name}</span>
                      {draft.backgroundId === background.id && <i><Check size={12} /></i>}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="ledger-form-grid">
                <div className="ledger-field">
                  <span>台账分类</span>
                  <AppSelect
                    ariaLabel="选择台账分类"
                    value={draft.categoryId}
                    options={categories.map((category) => ({ value: category.id, label: category.name }))}
                    onChange={(value) => setDraft({ ...draft, categoryId: value })}
                  />
                </div>
                <label className="ledger-field">
                  <span>记录日期</span>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  />
                </label>
              </div>

              <div className="ledger-form-grid">
                <div className="ledger-field">
                  <span>当前状态</span>
                  <AppSelect
                    ariaLabel="选择记录状态"
                    value={draft.status}
                    options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    onChange={(value) => setDraft({ ...draft, status: value as LedgerStatus })}
                  />
                </div>
                <div className="ledger-field">
                  <span>重要程度</span>
                  <AppSelect
                    ariaLabel="选择重要程度"
                    value={draft.importance}
                    options={Object.entries(IMPORTANCE_LABELS).map(([value, label]) => ({ value, label }))}
                    onChange={(value) => setDraft({ ...draft, importance: value as LedgerImportance })}
                  />
                </div>
              </div>

              <div className="ledger-form-grid value-grid">
                <label className="ledger-field">
                  <span>关键数值（可选）</span>
                  <input
                    type="number"
                    step="any"
                    value={draft.value}
                    onChange={(event) => setDraft({ ...draft, value: event.target.value })}
                    placeholder="例如：12"
                  />
                </label>
                <label className="ledger-field">
                  <span>单位（可选）</span>
                  <input
                    value={draft.unit}
                    onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                    placeholder="小时 / 元 / 篇"
                  />
                </label>
              </div>

              <label className="ledger-field full">
                <span>标签</span>
                <input
                  value={draft.tags}
                  onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                  placeholder="多个标签用逗号分隔"
                />
              </label>

              <label className="ledger-field full notes">
                <span>详细记录</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="记录背景、过程、结论或下一步……"
                />
              </label>

              <div className="ledger-form-actions">
                <button type="button" className="text-button" onClick={() => setDrawerOpen(false)}>取消</button>
                <button type="submit" className="primary-button">
                  {editingEntryId ? '保存修改' : '保存记录'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
