import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, FlaskConical, Star, DollarSign,
  Clock, Heart, X, Tag, Sparkles
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdeaScore, sortIdeasByScore } from '@/utils/scoring';
import { Idea } from '@/types';
import { formatDate } from '@/utils/date';

function ScoreProgress({ label, value, color, icon: Icon }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-600">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="font-mono font-semibold text-slate-700">{value}/5</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${(value / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

function ScoreCircle({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-bold text-sm" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function IdeaCard({ idea, onConvert, onDelete }: {
  idea: Idea;
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const score = calculateIdeaScore(idea);
  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    converted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  const statusText: Record<string, string> = {
    active: '活跃',
    converted: '已转化',
    archived: '已归档',
  };

  return (
    <div className="lab-card p-5 hover:-translate-y-1 transition-transform duration-200 relative group sticky-note">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ScoreCircle score={score} />
          <div>
            <h3 className="font-bold text-slate-900 mb-0.5 leading-tight">{idea.title}</h3>
            <span className={`lab-badge border ${statusStyles[idea.status]}`}>
              {statusText[idea.status]}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(idea.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-coral-600 hover:bg-coral-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
        {idea.description}
      </p>

      <div className="space-y-2.5 mb-4">
        <ScoreProgress
          label="低成本"
          value={6 - idea.costScore}
          color="bg-gradient-to-r from-coral-400 to-coral-500"
          icon={DollarSign}
        />
        <ScoreProgress
          label="短周期"
          value={6 - idea.cycleScore}
          color="bg-gradient-to-r from-lab-indigo-400 to-lab-indigo-500"
          icon={Clock}
        />
        <ScoreProgress
          label="兴趣度"
          value={idea.interestScore}
          color="bg-gradient-to-r from-emerald-400 to-emerald-500"
          icon={Heart}
        />
      </div>

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {formatDate(idea.createdAt)}
        </span>
        {idea.status === 'active' && (
          <button
            onClick={() => onConvert(idea.id)}
            className="lab-btn-amber !px-3 !py-1.5 text-xs"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            启动实验
          </button>
        )}
      </div>
    </div>
  );
}

function IdeaFormModal({ onClose, onSubmit, initialData }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Idea;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
  const [costScore, setCostScore] = useState(initialData?.costScore || 3);
  const [cycleScore, setCycleScore] = useState(initialData?.cycleScore || 3);
  const [interestScore, setInterestScore] = useState(initialData?.interestScore || 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title,
      description,
      tags,
      costScore,
      cycleScore,
      interestScore,
      status: 'active' as const,
    });
    onClose();
  };

  const ScoreSlider = ({ label, value, onChange, color, hintLow, hintHigh, icon: Icon }: any) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="lab-label mb-0 flex items-center gap-1.5">
          <Icon className="w-4 h-4" />
          {label}
        </label>
        <span className={`font-mono font-bold text-lg ${color}`}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-lab-amber-500"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{hintLow}</span>
        <span>{hintHigh}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {initialData ? '编辑灵感' : '记录新灵感'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="lab-label">灵感标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话描述你的副业点子"
              className="lab-input"
              required
            />
          </div>

          <div>
            <label className="lab-label">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="具体是做什么？面向谁？怎么赚钱？"
              rows={3}
              className="lab-textarea"
            />
          </div>

          <div>
            <label className="lab-label">标签（用逗号分隔）</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="资料包, 职场, 小红书"
              className="lab-input"
            />
          </div>

          <div className="pt-2 space-y-5">
            <div className="divider-ornament text-xs">
              <Star className="w-3 h-3" /> 三维打分
            </div>

            <ScoreSlider
              label="投入成本"
              value={costScore}
              onChange={setCostScore}
              color="text-coral-600"
              icon={DollarSign}
              hintLow="1=几乎零成本"
              hintHigh="5=高成本投入"
            />
            <ScoreSlider
              label="产出周期"
              value={cycleScore}
              onChange={setCycleScore}
              color="text-lab-indigo-600"
              icon={Clock}
              hintLow="1=1周内见效"
              hintHigh="5=3个月以上"
            />
            <ScoreSlider
              label="兴趣持久度"
              value={interestScore}
              onChange={setInterestScore}
              color="text-emerald-600"
              icon={Heart}
              hintLow="1=只是好奇"
              hintHigh="5=热爱沉迷"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
          <button type="button" onClick={onClose} className="lab-btn-secondary">
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="lab-btn-primary"
          >
            {initialData ? '保存修改' : '💾 保存灵感'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ideas() {
  const navigate = useNavigate();
  const ideas = useAppStore((s) => s.ideas);
  const addIdea = useAppStore((s) => s.addIdea);
  const deleteIdea = useAppStore((s) => s.deleteIdea);
  const convertIdeaToExperiment = useAppStore((s) => s.convertIdeaToExperiment);

  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [ideas]);

  const sortedIdeas = useMemo(() => {
    let list = ideas;
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    if (filterTag) {
      list = list.filter((i) => i.tags.includes(filterTag));
    }
    return sortIdeasByScore(list);
  }, [ideas, searchText, filterTag]);

  const handleConvert = (ideaId: string) => {
    const expId = convertIdeaToExperiment(ideaId);
    navigate(`/experiments/${expId}`);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 页面头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">💡</span>
            灵感池
          </h1>
          <p className="text-slate-500 mt-1.5">
            捕捉每一个副业点子，打分筛选出最值得尝试的
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          记录新灵感
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="lab-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索灵感标题或描述..."
              className="lab-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-500 mr-1">标签筛选：</span>
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
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
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

      {/* 灵感列表 */}
      {sortedIdeas.length === 0 ? (
        <div className="lab-card p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
            <span className="text-4xl">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {searchText || filterTag ? '没有匹配的灵感' : '灵感池空空如也'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {searchText || filterTag ? '试试换个关键词吧' : '好点子从记录开始！哪怕再小的想法也记下来'}
          </p>
          {!searchText && !filterTag && (
            <button onClick={() => setShowModal(true)} className="lab-btn-primary">
              <Sparkles className="w-4 h-4" />
              记录第一个灵感
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onConvert={handleConvert}
              onDelete={deleteIdea}
            />
          ))}
        </div>
      )}

      {showModal && (
        <IdeaFormModal
          onClose={() => setShowModal(false)}
          onSubmit={addIdea}
        />
      )}
    </div>
  );
}
