import { useState, useMemo } from 'react';
import {
  Plus, FolderKanban, FileText, Image, FileSpreadsheet,
  MessageCircle, X, Search, Tag, Download, Trash2, Copy, Check, FileDown
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Material, MaterialCategory } from '@/types';
import { formatDate } from '@/utils/date';
import { downloadReport } from '@/utils/report';

const categoryConfig: Record<MaterialCategory, {
  label: string; icon: any; color: string; bg: string; border: string;
}> = {
  copywriting: {
    label: '文案', icon: FileText,
    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200',
  },
  image: {
    label: '图片/设计', icon: Image,
    color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200',
  },
  quotation: {
    label: '报价单', icon: FileSpreadsheet,
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
  },
  reply: {
    label: '常用回复', icon: MessageCircle,
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
  },
};

export default function Materials() {
  const materials = useAppStore((s) => s.materials);
  const addMaterial = useAppStore((s) => s.addMaterial);
  const updateMaterial = useAppStore((s) => s.updateMaterial);
  const deleteMaterial = useAppStore((s) => s.deleteMaterial);
  const exportWeeklyReport = useAppStore((s) => s.exportWeeklyReport);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MaterialCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'copywriting' as MaterialCategory,
    title: '',
    content: '',
    tagsInput: '',
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    materials.forEach(m => m.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [materials]);

  const filtered = useMemo(() => {
    let list = materials;
    if (filter !== 'all') list = list.filter(m => m.category === filter);
    if (filterTag) list = list.filter(m => m.tags.includes(filterTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [materials, filter, filterTag, search]);

  const groupedCount = useMemo(() => {
    const count: Record<string, number> = { all: materials.length };
    Object.keys(categoryConfig).forEach(k => {
      count[k] = materials.filter(m => m.category === k).length;
    });
    return count;
  }, [materials]);

  const openModal = (m?: Material) => {
    if (m) {
      setEditing(m);
      setForm({
        category: m.category,
        title: m.title,
        content: m.content,
        tagsInput: m.tags.join(', '),
      });
    } else {
      setEditing(null);
      setForm({
        category: 'copywriting',
        title: '',
        content: '',
        tagsInput: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const tags = form.tagsInput
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (editing) {
      updateMaterial(editing.id, {
        category: form.category,
        title: form.title,
        content: form.content,
        tags,
      });
    } else {
      addMaterial({
        category: form.category,
        title: form.title,
        content: form.content,
        tags,
      });
    }
    setShowModal(false);
  };

  const handleCopy = async (m: Material) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopyId(m.id);
      setTimeout(() => setCopyId(null), 2000);
    } catch {
      alert('复制失败');
    }
  };

  const handleExportWeekly = () => {
    const md = exportWeeklyReport();
    downloadReport(md);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">📁</span>
            素材库
          </h1>
          <p className="text-slate-500 mt-1.5">
            沉淀复用内容资产，让每一次发布更高效
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportWeekly} className="lab-btn-secondary">
            <FileDown className="w-4 h-4" />
            导出周报
          </button>
          <button onClick={() => openModal()} className="lab-btn-primary">
            <Plus className="w-4 h-4" />
            新建素材
          </button>
        </div>
      </div>

      {/* 分类卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`lab-card p-4 text-left transition-all ${
            filter === 'all' ? 'ring-2 ring-lab-indigo-400 -translate-y-1' : 'hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-800">{groupedCount.all}</div>
              <div className="text-xs text-slate-500">全部素材</div>
            </div>
          </div>
        </button>
        {(Object.keys(categoryConfig) as MaterialCategory[]).map(key => {
          const cfg = categoryConfig[key];
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`lab-card p-4 text-left transition-all ${
                filter === key ? 'ring-2 ring-lab-indigo-400 -translate-y-1' : 'hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${cfg.color}`}>{groupedCount[key] || 0}</div>
                  <div className="text-xs text-slate-500">{cfg.label}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 搜索+标签 */}
      <div className="lab-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索素材标题、内容或标签..."
              className="lab-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> 标签：
            </span>
            <button
              onClick={() => setFilterTag(null)}
              className={`lab-badge cursor-pointer transition-colors ${
                filterTag === null
                  ? 'bg-lab-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`lab-badge cursor-pointer transition-colors ${
                  filterTag === tag
                    ? 'bg-lab-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 素材列表 */}
      {filtered.length === 0 ? (
        <div className="lab-card p-16 text-center">
          <FolderKanban className="w-20 h-20 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {search || filterTag || filter !== 'all' ? '没有匹配的素材' : '素材库还是空的'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            把常用的文案、报价、回复模板保存下来，下次用只需一键复制
          </p>
          <button onClick={() => openModal()} className="lab-btn-primary">
            <Plus className="w-4 h-4" />
            保存第一个素材
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const cfg = categoryConfig[m.category];
            const Icon = cfg.icon;
            const copied = copyId === m.id;
            return (
              <div
                key={m.id}
                className={`lab-card p-5 border-t-4 overflow-hidden relative ${
                  m.category === 'copywriting' ? '!border-t-indigo-500' :
                  m.category === 'image' ? '!border-t-rose-500' :
                  m.category === 'quotation' ? '!border-t-amber-500' : '!border-t-emerald-500'
                } group`}
              >
                {/* 顶部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`lab-badge border ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('删除该素材？')) deleteMaterial(m.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-coral-50 hover:text-coral-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 mb-2 leading-snug line-clamp-1">
                  {m.title}
                </h4>

                <div className={`${cfg.bg} rounded-lg p-3 mb-3 border ${cfg.border} relative`}>
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed line-clamp-6">
                    {m.content}
                  </pre>
                </div>

                {/* 标签+操作 */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {m.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="lab-badge !py-0 bg-slate-50 text-slate-600 text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {m.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{m.tags.length - 3}</span>
                      )}
                    </div>
                  ) : <div />}
                  <button
                    onClick={() => handleCopy(m)}
                    className={`lab-btn !px-3 !py-1.5 !text-xs transition-all ${
                      copied
                        ? '!bg-emerald-500 !text-white'
                        : '!bg-slate-100 !text-slate-600 hover:!bg-lab-indigo-500 hover:!text-white'
                    }`}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> 已复制</> : <><Copy className="w-3.5 h-3.5" /> 复制</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
              <h3 className="font-bold text-lg">
                {editing ? '编辑素材' : '新建素材'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">素材分类</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(categoryConfig) as MaterialCategory[]).map(key => {
                      const cfg = categoryConfig[key];
                      const CatIcon = cfg.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setForm({ ...form, category: key })}
                          className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            form.category === key
                              ? cfg.border + ' ' + cfg.bg + ' ring-2 ring-lab-indigo-300'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <CatIcon className={`w-4 h-4 ${form.category === key ? cfg.color : 'text-slate-400'}`} />
                          <span className={`text-[11px] font-medium ${form.category === key ? cfg.color : 'text-slate-500'}`}>
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="lab-label">标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="lab-input"
                    placeholder="素材名称，如：小红书涨粉模板"
                  />
                </div>
              </div>
              <div>
                <label className="lab-label">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={form.tagsInput}
                  onChange={e => setForm({ ...form, tagsInput: e.target.value })}
                  className="lab-input"
                  placeholder="小红书, 引流, 模板"
                />
              </div>
              <div>
                <label className="lab-label">内容 *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={10}
                  className="lab-textarea font-sans leading-relaxed"
                  placeholder={
                    form.category === 'copywriting' ? '请输入文案内容...' :
                    form.category === 'quotation' ? '请输入报价方案...' :
                    form.category === 'reply' ? '请输入回复话术...' :
                    '请输入图片描述或设计要点...'
                  }
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-between bg-slate-50">
              {editing && (
                <button
                  onClick={() => { deleteMaterial(editing.id); setShowModal(false); }}
                  className="lab-btn-ghost !text-coral-600"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setShowModal(false)} className="lab-btn-secondary">取消</button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim() || !form.content.trim()}
                  className="lab-btn-primary"
                >
                  {editing ? '保存修改' : '💾 保存素材'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
