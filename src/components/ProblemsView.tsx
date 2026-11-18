import { FormEvent, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  Filter,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { AppSelect } from './AppSelect';
import { createId } from '../data';
import { Problem, ProblemStatus } from '../types';

const statusLabels: Record<ProblemStatus, string> = {
  unsolved: '未开始',
  attempting: '尝试中',
  solved: '已解决',
  review: '需复习',
};

const statusColors: Record<ProblemStatus, string> = {
  unsolved: '#8b93a7',
  attempting: '#6b78dd',
  solved: '#4caf7d',
  review: '#d98a4a',
};

const difficultyOrder = ['入门', '普及-', '普及/提高-', '普及+/提高', '提高+/省选-', '省选/NOI-', 'NOI/NOI+/CTSC'] as const;
const difficultyColors: Record<string, string> = {
  入门: '#6bddad',
  '普及-': '#8fd3a3',
  '普及/提高-': '#c7d96c',
  '普及+/提高': '#edc951',
  '提高+/省选-': '#f2a94b',
  '省选/NOI-': '#e67868',
  'NOI/NOI+/CTSC': '#d94e6e',
};

function getDifficultyColor(difficulty: string) {
  return difficultyColors[difficulty] || '#8b93a7';
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 2) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

const statusOptions: Array<{ value: ProblemStatus; label: string }> = [
  { value: 'unsolved', label: '未开始' },
  { value: 'attempting', label: '尝试中' },
  { value: 'solved', label: '已解决' },
  { value: 'review', label: '需复习' },
];

export function ProblemsView({
  problems,
  onAdd,
  onUpdate,
  onDelete,
}: {
  problems: Problem[];
  onAdd: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, patch: Partial<Problem>) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: '',
    source: '',
    difficulty: '普及/提高-',
    tags: '',
    status: 'unsolved' as ProblemStatus,
    url: '',
    notes: '',
    category: '默认',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => set.add(p.category || '默认'));
    return Array.from(set).sort();
  }, [problems]);

  const filtered = useMemo(() => {
    let result = problems;
    if (selectedCategory !== 'all') {
      result = result.filter((p) => (p.category || '默认') === selectedCategory);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.notes.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [problems, selectedCategory, statusFilter, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: problems.length };
    categories.forEach((c) => (counts[c] = problems.filter((p) => (p.category || '默认') === c).length));
    return counts;
  }, [problems, categories]);

  function resetDraft() {
    setDraft({
      title: '',
      source: '',
      difficulty: '普及/提高-',
      tags: '',
      status: 'unsolved',
      url: '',
      notes: '',
      category: '默认',
    });
    setEditingId(null);
    setShowComposer(false);
  }

  function openAdd() {
    resetDraft();
    setShowComposer(true);
  }

  function openEdit(problem: Problem) {
    setDraft({
      title: problem.title,
      source: problem.source,
      difficulty: problem.difficulty,
      tags: problem.tags.join(', '),
      status: problem.status,
      url: problem.url,
      notes: problem.notes,
      category: problem.category || '默认',
    });
    setEditingId(problem.id);
    setShowComposer(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const tags = draft.tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      onUpdate(editingId, {
        title,
        source: draft.source.trim(),
        difficulty: draft.difficulty,
        tags,
        status: draft.status,
        url: draft.url.trim(),
        notes: draft.notes.trim(),
        category: draft.category.trim() || '默认',
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAdd({
        title,
        source: draft.source.trim(),
        difficulty: draft.difficulty,
        tags,
        status: draft.status,
        url: draft.url.trim(),
        notes: draft.notes.trim(),
        category: draft.category.trim() || '默认',
      });
    }
    resetDraft();
  }

  function openProblem(url: string) {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  const statusCounts = useMemo(() => {
    const counts: Record<ProblemStatus, number> = { unsolved: 0, attempting: 0, solved: 0, review: 0 };
    problems.forEach((p) => { counts[p.status]++; });
    return counts;
  }, [problems]);

  return (
    <div className="problems-layout">
      <aside className="problems-categories">
        <div className="problems-categories-head">
          <div>
            <h2>信息学题单</h2>
          </div>
          <button type="button" className="round-add" onClick={openAdd} aria-label="添加题目">
            <Plus size={17} />
          </button>
        </div>

        <div className="problems-search">
          <Search size={14} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索题目、标签、来源…"
          />
        </div>

        <div className="problems-categories-list">
          <button
            type="button"
            className={`problem-category-item ${selectedCategory === 'all' ? 'selected' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <BookOpen size={14} />
            <span>全部题目</span>
            <b>{categoryCounts.all}</b>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`problem-category-item ${selectedCategory === cat ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <Tags size={14} />
              <span>{cat}</span>
              <b>{categoryCounts[cat] || 0}</b>
            </button>
          ))}
        </div>

        <div className="problems-stats">
          <div className="problems-stat solved">
            <span>已解决</span>
            <strong>{statusCounts.solved}</strong>
          </div>
          <div className="problems-stat attempting">
            <span>尝试中</span>
            <strong>{statusCounts.attempting}</strong>
          </div>
          <div className="problems-stat unsolved">
            <span>未开始</span>
            <strong>{statusCounts.unsolved}</strong>
          </div>
          <div className="problems-stat review">
            <span>需复习</span>
            <strong>{statusCounts.review}</strong>
          </div>
        </div>
      </aside>

      <section className="problems-main">
        <div className="problems-toolbar">
          <div className="problems-filter-group">
            <Filter size={14} />
            <AppSelect
              ariaLabel="按状态筛选"
              value={statusFilter}
              options={[
                { value: 'all', label: '全部状态' },
                ...statusOptions.map((s) => ({ value: s.value, label: s.label })),
              ]}
              onChange={(v) => setStatusFilter(v)}
            />
          </div>
          <div className="problems-count">
            共 <strong>{filtered.length}</strong> 道题
          </div>
          <button type="button" className="primary-button" onClick={openAdd}>
            <Plus size={15} /> 添加题目
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="problems-empty">
            <BookOpen size={32} />
            <strong>{searchQuery || statusFilter !== 'all' || selectedCategory !== 'all' ? '没有匹配的题目' : '题库还是空的'}</strong>
            <p>
              {searchQuery || statusFilter !== 'all' || selectedCategory !== 'all'
                ? '试试调整筛选条件，或添加一道新题目。'
                : '点击「添加题目」开始建立你的信息学个人题库。'}
            </p>
            <button type="button" className="secondary-button" onClick={openAdd}>
              <Plus size={14} /> 添加第一道题
            </button>
          </div>
        ) : (
          <div className="problems-grid">
            {filtered.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onEdit={() => openEdit(problem)}
                onDelete={() => onDelete(problem.id)}
                onStatusChange={(status) => onUpdate(problem.id, { status })}
                onOpenUrl={() => openProblem(problem.url)}
              />
            ))}
          </div>
        )}
      </section>

      {showComposer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={resetDraft}>
          <form className="problem-composer" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
            <div className="composer-heading">
              <div>
                <span className="eyebrow">{editingId ? '编辑题目' : '快速添加'}</span>
                <h2>{editingId ? '修改题目信息' : '加入一道题目'}</h2>
              </div>
              <button type="button" className="icon-button" aria-label="关闭" onClick={resetDraft}>
                <X size={18} />
              </button>
            </div>

            <label className="field full-field">
              <span>题目标题</span>
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="例如：最长上升子序列"
              />
            </label>

            <div className="form-grid">
              <label className="field">
                <span>来源 / 题号</span>
                <input
                  value={draft.source}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                  placeholder="例如：洛谷 B3637"
                />
              </label>
              <div className="field">
                <span>难度</span>
                <AppSelect
                  ariaLabel="选择难度"
                  value={draft.difficulty}
                  options={difficultyOrder.map((d) => ({ value: d, label: d }))}
                  onChange={(v) => setDraft({ ...draft, difficulty: v })}
                />
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>分类 / 专题</span>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="例如：DP 专题"
                />
              </label>
              <div className="field">
                <span>状态</span>
                <AppSelect
                  ariaLabel="选择题目状态"
                  value={draft.status}
                  options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(v) => setDraft({ ...draft, status: v as ProblemStatus })}
                />
              </div>
            </div>

            <label className="field full-field">
              <span>算法标签（用逗号分隔）</span>
              <input
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="例如：DP, 序列, 贪心"
              />
            </label>

            <label className="field full-field">
              <span>原题链接</span>
              <input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…（可选）"
              />
            </label>

            <label className="field full-field">
              <span>解题思路 / 备注</span>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="记录思路、易错点、优化方向…"
                rows={3}
              />
            </label>

            <div className="composer-actions">
              <button type="button" className="text-button" onClick={resetDraft}>
                取消
              </button>
              <button type="submit" className="primary-button" disabled={!draft.title.trim()}>
                {editingId ? '保存修改' : '加入题库'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProblemCard({
  problem,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenUrl,
}: {
  problem: Problem;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ProblemStatus) => void;
  onOpenUrl: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="problem-card" style={{ borderLeftColor: getDifficultyColor(problem.difficulty) }}>
      <div className="problem-card-header">
        <div className="problem-card-title-row">
          <span className="problem-difficulty" style={{ background: getDifficultyColor(problem.difficulty) }}>
            {problem.difficulty}
          </span>
          <h3>{problem.title}</h3>
        </div>
        <div className="problem-card-actions">
          <div className={`problem-status-menu ${menuOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="problem-status-trigger"
              style={{ color: statusColors[problem.status] }}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span style={{ background: statusColors[problem.status] }} />
              {statusLabels[problem.status]}
              <ChevronDown size={12} />
            </button>
            {menuOpen && (
              <div className="problem-status-dropdown">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={problem.status === opt.value ? 'selected' : ''}
                    onClick={() => {
                      onStatusChange(opt.value);
                      setMenuOpen(false);
                    }}
                  >
                    <span style={{ background: statusColors[opt.value] }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="problem-icon-btn" onClick={onEdit} title="编辑">
            <Pencil size={14} />
          </button>
          <button type="button" className="problem-icon-btn danger" onClick={onDelete} title="删除">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {problem.source && (
        <div className="problem-card-source">
          <span>{problem.source}</span>
          {problem.url && (
            <button type="button" className="problem-open-link" onClick={onOpenUrl}>
              <ExternalLink size={12} /> 查看原题
            </button>
          )}
        </div>
      )}

      {problem.tags.length > 0 && (
        <div className="problem-tags">
          {problem.tags.map((tag) => (
            <span key={tag} className="problem-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {problem.notes && <p className="problem-notes">{problem.notes}</p>}

      <div className="problem-card-footer">
        <span className="problem-category">{problem.category || '默认'}</span>
        <span className="problem-time">更新于 {relativeTime(problem.updatedAt)}</span>
      </div>
    </article>
  );
}
