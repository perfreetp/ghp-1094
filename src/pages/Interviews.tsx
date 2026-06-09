import { useState, useMemo } from 'react';
import {
  Plus, MessageSquareText, X, Trash2, Calendar, User,
  FlaskConical, Hash, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Interview } from '@/types';
import { formatDate, toSafeISODate, toDateInputValue, isValidDateInput } from '@/utils/date';

export default function Interviews() {
  const interviews = useAppStore((s) => s.interviews);
  const experiments = useAppStore((s) => s.experiments);
  const addInterview = useAppStore((s) => s.addInterview);
  const deleteInterview = useAppStore((s) => s.deleteInterview);

  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterExp, setFilterExp] = useState<string | null>(null);
  const [form, setForm] = useState({
    experimentId: '' as string,
    interviewee: '',
    contactInfo: '',
    date: toDateInputValue(),
    questionsText: '',
    notes: '',
  });

  const filtered = filterExp
    ? interviews.filter(i => i.experimentId === filterExp)
    : interviews;

  const questionStats = useMemo(() => {
    const counter: Record<string, number> = {};
    interviews.forEach(i => {
      i.questions.forEach(q => {
        counter[q] = (counter[q] || 0) + 1;
      });
    });
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [interviews]);

  const interviewsByExp = useMemo(() => {
    const groups: Record<string, Interview[]> = {};
    filtered.forEach(i => {
      const key = i.experimentId || 'none';
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    return groups;
  }, [filtered]);

  const handleSubmit = () => {
    if (!form.interviewee.trim()) return;
    const questions = form.questionsText
      .split(/\n|;|；/)
      .map(s => s.trim())
      .filter(Boolean);
    addInterview({
      experimentId: form.experimentId || null,
      interviewee: form.interviewee,
      contactInfo: form.contactInfo || undefined,
      date: toSafeISODate(form.date),
      questions,
      notes: form.notes,
    });
    setShowModal(false);
    setForm({
      experimentId: '',
      interviewee: '',
      contactInfo: '',
      date: toDateInputValue(),
      questionsText: '',
      notes: '',
    });
  };

  const maxCount = questionStats[0]?.[1] || 1;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">🎙️</span>
            访谈窗口
          </h1>
          <p className="text-slate-500 mt-1.5">
            倾听用户声音，高频问题就是最好的产品方向
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          记录访谈
        </button>
      </div>

      {/* 数据概览 + 高频问题 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lab-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-slate-800">{interviews.length}</div>
              <div className="text-sm text-slate-500">累计访谈次数</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>涉及实验数</span>
              <span className="font-semibold text-slate-800">{new Set(interviews.map(i => i.experimentId).filter(Boolean)).size} 个</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>收集问题数</span>
              <span className="font-semibold text-slate-800">{questionStats.length} 个</span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <label className="lab-label text-xs">按实验筛选</label>
            <select
              value={filterExp || ''}
              onChange={e => setFilterExp(e.target.value || null)}
              className="lab-input"
            >
              <option value="">全部实验</option>
              {experiments.map(e => (
                <option key={e.id} value={e.id}>🧪 {e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 高频问题词云 */}
        <div className="lg:col-span-2 lab-card p-6">
          <h3 className="section-title mb-5">
            <Hash className="w-5 h-5 text-amber-500" />
            高频问题 TOP15
          </h3>
          {questionStats.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquareText className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p>还没有记录访谈问题</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {questionStats.map(([q, count]) => {
                const intensity = count / maxCount;
                const size = 12 + intensity * 12;
                const bgOpacity = 0.1 + intensity * 0.25;
                return (
                  <div
                    key={q}
                    className="px-3 py-1.5 rounded-full border border-amber-200 text-slate-800 flex items-center gap-1.5 hover:scale-105 transition-transform cursor-default"
                    style={{
                      fontSize: `${size}px`,
                      backgroundColor: `rgba(245, 158, 11, ${bgOpacity})`,
                      fontWeight: intensity > 0.5 ? 600 : 400,
                    }}
                  >
                    {q}
                    <span className="text-xs text-amber-700 font-bold bg-white/70 rounded-full px-1.5">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 访谈列表分组 */}
      <div className="space-y-6">
        {Object.keys(interviewsByExp).length === 0 ? (
          <div className="lab-card p-16 text-center">
            <MessageSquareText className="w-20 h-20 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">还没有访谈记录</h3>
            <p className="text-sm text-slate-500 mb-5">
              与10个潜在用户聊天，胜过闭门造车30天
            </p>
            <button onClick={() => setShowModal(true)} className="lab-btn-primary">
              <Plus className="w-4 h-4" />
              记录第一次访谈
            </button>
          </div>
        ) : (
          Object.entries(interviewsByExp).map(([expId, list]) => {
            const exp = experiments.find(e => e.id === expId);
            return (
              <div key={expId} className="lab-card p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <FlaskConical className="w-5 h-5 text-lab-indigo-500" />
                  <h3 className="font-bold text-slate-800">
                    {exp ? exp.title : '通用访谈（未关联实验）'}
                  </h3>
                  <span className="lab-badge bg-slate-100 text-slate-600">{list.length} 场</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(interview => {
                      const isExpanded = expanded === interview.id;
                      return (
                        <div
                          key={interview.id}
                          className="border border-slate-200 rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
                        >
                          <div
                            onClick={() => setExpanded(isExpanded ? null : interview.id)}
                            className="p-4 bg-gradient-to-r from-indigo-50/50 to-white cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lab-amber-300 to-lab-amber-500 flex items-center justify-center text-white font-bold shadow-sm">
                                {interview.interviewee.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  {interview.interviewee}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(interview.date, 'chinese')}
                                  {interview.contactInfo && (
                                    <span className="text-indigo-500">· {interview.contactInfo}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="lab-badge bg-indigo-100 text-indigo-700">
                                {interview.questions.length} 个问题
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 space-y-4">
                              <div>
                                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                  <Hash className="w-3 h-3" /> 访谈问题
                                </div>
                                <div className="space-y-1.5">
                                  {interview.questions.map((q, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                      <span className="w-5 h-5 rounded-full bg-lab-amber-100 text-lab-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                      </span>
                                      <p className="text-sm text-slate-700">{q}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {interview.notes && (
                                <div>
                                  <div className="text-xs font-semibold text-slate-500 mb-2">📝 访谈笔记</div>
                                  <div className="p-3 bg-lab-notebook rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {interview.notes}
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => deleteInterview(interview.id)}
                                  className="lab-btn-ghost !text-coral-600 !text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  删除记录
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquareText className="w-5 h-5" />
                记录访谈
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="lab-label">访谈对象 *</label>
                <input
                  type="text"
                  value={form.interviewee}
                  onChange={e => setForm({ ...form, interviewee: e.target.value })}
                  className="lab-input"
                  placeholder="昵称或称呼"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">联系方式</label>
                  <input
                    type="text"
                    value={form.contactInfo}
                    onChange={e => setForm({ ...form, contactInfo: e.target.value })}
                    className="lab-input"
                    placeholder="微信/小红书等"
                  />
                </div>
                <div>
                  <label className="lab-label">访谈日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="lab-input"
                  />
                </div>
              </div>
              <div>
                <label className="lab-label">关联实验</label>
                <select
                  value={form.experimentId}
                  onChange={e => setForm({ ...form, experimentId: e.target.value })}
                  className="lab-input"
                >
                  <option value="">不关联</option>
                  {experiments.map(e => <option key={e.id} value={e.id}>🧪 {e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="lab-label">访谈问题（每行一个）</label>
                <textarea
                  value={form.questionsText}
                  onChange={e => setForm({ ...form, questionsText: e.target.value })}
                  rows={4}
                  className="lab-textarea font-mono"
                  placeholder={'你最关心的问题是什么？\n你之前尝试过哪些方法？\n愿意付多少钱解决？'}
                />
              </div>
              <div>
                <label className="lab-label">访谈笔记/用户反馈</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  className="lab-textarea"
                  placeholder="用户说了什么？有什么痛点？态度积极还是冷淡？"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
              <button onClick={() => setShowModal(false)} className="lab-btn-secondary">取消</button>
              <button onClick={handleSubmit} disabled={!form.interviewee.trim()} className="lab-btn-primary">
                保存访谈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
