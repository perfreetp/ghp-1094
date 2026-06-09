import { useState } from 'react';
import {
  Plus, Send, TrendingUp, Handshake, X, MessageSquare,
  ThumbsUp, Eye, MessageCircle, Link as LinkIcon, DollarSign, Calendar, Trash2
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ChannelRecord, ChannelType } from '@/types';
import { formatDate, toSafeISODate, toDateInputValue, isValidDateInput } from '@/utils/date';

const typeConfig: Record<ChannelType, { label: string; icon: any; color: string; bg: string; border: string }> = {
  post: { label: '发帖记录', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  ads: { label: '投放记录', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  cooperation: { label: '合作记录', icon: Handshake, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const platformOptions = ['小红书', '知乎', '抖音', '视频号', 'B站', '闲鱼', '朋友圈', '公众号', '微博', '其他'];

export default function Channels() {
  const channelRecords = useAppStore((s) => s.channelRecords);
  const experiments = useAppStore((s) => s.experiments);
  const addChannelRecord = useAppStore((s) => s.addChannelRecord);
  const deleteChannelRecord = useAppStore((s) => s.deleteChannelRecord);

  const [filter, setFilter] = useState<ChannelType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'post' as ChannelType,
    platform: platformOptions[0],
    content: '',
    experimentId: '' as string,
    views: '' as string,
    likes: '' as string,
    comments: '' as string,
    clicks: '' as string,
    conversions: '' as string,
    budget: '' as string,
    feedback: '',
    date: toDateInputValue(),
  });

  const filtered = channelRecords.filter(
    (r) => filter === 'all' || r.type === filter
  );

  const totalMetrics = channelRecords.reduce(
    (acc, r) => ({
      views: acc.views + (r.metrics.views || 0),
      likes: acc.likes + (r.metrics.likes || 0),
      comments: acc.comments + (r.metrics.comments || 0),
      clicks: acc.clicks + (r.metrics.clicks || 0),
      conversions: acc.conversions + (r.metrics.conversions || 0),
      budget: acc.budget + (r.metrics.budget || 0),
    }),
    { views: 0, likes: 0, comments: 0, clicks: 0, conversions: 0, budget: 0 }
  );

  const handleSubmit = () => {
    if (!form.content.trim()) return;
    addChannelRecord({
      experimentId: form.experimentId || null,
      type: form.type,
      platform: form.platform,
      content: form.content,
      date: toSafeISODate(form.date),
      metrics: {
        views: form.views ? Number(form.views) : undefined,
        likes: form.likes ? Number(form.likes) : undefined,
        comments: form.comments ? Number(form.comments) : undefined,
        clicks: form.clicks ? Number(form.clicks) : undefined,
        conversions: form.conversions ? Number(form.conversions) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        feedback: form.feedback || undefined,
      },
    });
    setShowModal(false);
    setForm({
      type: 'post',
      platform: platformOptions[0],
      content: '',
      experimentId: '',
      views: '',
      likes: '',
      comments: '',
      clicks: '',
      conversions: '',
      budget: '',
      feedback: '',
      date: toDateInputValue(),
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">📣</span>
            渠道记录
          </h1>
          <p className="text-slate-500 mt-1.5">
            记录每一次运营动作，追踪渠道效果
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          添加记录
        </button>
      </div>

      {/* 数据汇总 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: '总曝光', value: totalMetrics.views, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '获赞数', value: totalMetrics.likes, icon: ThumbsUp, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: '评论数', value: totalMetrics.comments, icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '点击数', value: totalMetrics.clicks, icon: LinkIcon, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: '转化数', value: totalMetrics.conversions, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '投放花费', value: `¥${totalMetrics.budget}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="lab-card p-4">
              <div className={`w-8 h-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">{m.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 items-center flex-wrap">
        {(['all', 'post', 'ads', 'cooperation'] as const).map((key) => {
          const config = key === 'all' ? null : typeConfig[key];
          const Icon = config?.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`lab-badge cursor-pointer transition-all ${
                filter === key
                  ? '!bg-lab-indigo-500 !text-white shadow-sm scale-105'
                  : config
                  ? `${config.bg} ${config.color}`
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {key === 'all' ? '全部记录' : config?.label}
              <span className="ml-1 opacity-70">
                ({key === 'all' ? channelRecords.length : channelRecords.filter(r => r.type === key).length})
              </span>
            </button>
          );
        })}
      </div>

      {/* 时间轴 */}
      <div className="lab-card p-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Send className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">还没有渠道记录</h3>
            <p className="text-sm text-slate-500 mb-4">记录每一次发帖、投放或合作，积累运营数据</p>
            <button onClick={() => setShowModal(true)} className="lab-btn-primary">
              <Plus className="w-4 h-4" />
              记录第一次运营
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-7 top-2 bottom-2 w-0.5 bg-gradient-to-b from-lab-indigo-300 via-lab-amber-300 to-emerald-300"></div>
            <div className="space-y-5">
              {filtered
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => {
                  const config = typeConfig[record.type];
                  const Icon = config.icon;
                  const exp = experiments.find(e => e.id === record.experimentId);
                  return (
                    <div key={record.id} className="relative pl-16 group">
                      <div className={`absolute left-3 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className={`p-5 rounded-xl border-2 ${config.border} ${config.bg} bg-opacity-30 transition-all group-hover:shadow-md`}>
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`lab-badge ${config.bg} ${config.color} border ${config.border}`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                              <span className="lab-badge bg-white border border-slate-200 text-slate-600">
                                {record.platform}
                              </span>
                              {exp && (
                                <span className="lab-badge bg-white border border-indigo-200 text-indigo-600">
                                  🧪 {exp.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(record.date, 'chinese')}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteChannelRecord(record.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-coral-600 hover:bg-coral-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-slate-800 leading-relaxed mb-3 whitespace-pre-wrap">
                          {record.content}
                        </p>

                        {/* 指标数据 */}
                        {(record.metrics.views || record.metrics.likes || record.metrics.clicks || record.metrics.conversions || record.metrics.budget) && (
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pt-3 border-t border-white/60">
                            {record.metrics.views != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">曝光</div>
                                <div className="font-bold font-mono text-slate-800">{record.metrics.views}</div>
                              </div>
                            )}
                            {record.metrics.likes != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">点赞</div>
                                <div className="font-bold font-mono text-slate-800">{record.metrics.likes}</div>
                              </div>
                            )}
                            {record.metrics.comments != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">评论</div>
                                <div className="font-bold font-mono text-slate-800">{record.metrics.comments}</div>
                              </div>
                            )}
                            {record.metrics.clicks != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">点击</div>
                                <div className="font-bold font-mono text-slate-800">{record.metrics.clicks}</div>
                              </div>
                            )}
                            {record.metrics.conversions != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">转化</div>
                                <div className="font-bold font-mono text-emerald-600">{record.metrics.conversions}</div>
                              </div>
                            )}
                            {record.metrics.budget != null && (
                              <div className="text-center p-2 bg-white/70 rounded-lg">
                                <div className="text-xs text-slate-500">花费</div>
                                <div className="font-bold font-mono text-amber-600">¥{record.metrics.budget}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {record.metrics.feedback && (
                          <div className="mt-3 p-3 bg-white/80 rounded-lg border border-white">
                            <div className="text-xs text-slate-500 mb-1">💬 反馈总结</div>
                            <p className="text-sm text-slate-700">{record.metrics.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 添加记录弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
              <h3 className="font-bold text-lg">添加渠道记录</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">记录类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ChannelType })}
                    className="lab-input"
                  >
                    <option value="post">📝 发帖记录</option>
                    <option value="ads">💰 投放记录</option>
                    <option value="cooperation">🤝 合作记录</option>
                  </select>
                </div>
                <div>
                  <label className="lab-label">平台</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="lab-input"
                  >
                    {platformOptions.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="lab-label">关联实验</label>
                <select
                  value={form.experimentId}
                  onChange={(e) => setForm({ ...form, experimentId: e.target.value })}
                  className="lab-input"
                >
                  <option value="">不关联</option>
                  {experiments.map(e => <option key={e.id} value={e.id}>🧪 {e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="lab-label">日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="lab-input"
                />
              </div>
              <div>
                <label className="lab-label">内容 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3}
                  className="lab-textarea"
                  placeholder="记录内容要点、标题或文案..."
                />
              </div>
              <div className="pt-2">
                <div className="divider-ornament text-xs text-slate-400 mb-3">
                  数据指标（可选）
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="lab-label text-xs">曝光量</label>
                    <input type="number" value={form.views} onChange={e => setForm({...form, views: e.target.value})} className="lab-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="lab-label text-xs">点赞</label>
                    <input type="number" value={form.likes} onChange={e => setForm({...form, likes: e.target.value})} className="lab-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="lab-label text-xs">评论</label>
                    <input type="number" value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} className="lab-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="lab-label text-xs">点击</label>
                    <input type="number" value={form.clicks} onChange={e => setForm({...form, clicks: e.target.value})} className="lab-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="lab-label text-xs">转化数</label>
                    <input type="number" value={form.conversions} onChange={e => setForm({...form, conversions: e.target.value})} className="lab-input" placeholder="0" />
                  </div>
                  {form.type === 'ads' && (
                    <div>
                      <label className="lab-label text-xs">投放预算</label>
                      <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="lab-input" placeholder="0" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="lab-label">反馈/备注</label>
                <textarea
                  value={form.feedback}
                  onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                  rows={2}
                  className="lab-textarea"
                  placeholder="效果评价、合作反馈等"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
              <button onClick={() => setShowModal(false)} className="lab-btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} disabled={!form.content.trim()} className="lab-btn-primary">
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
