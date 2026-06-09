import { useState, useMemo } from 'react';
import {
  BarChart3, Check, Pause, XCircle, TrendingUp, Target,
  ChevronRight, BarChart2, GitCompare, Sparkles, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { getExperimentRecommendation, getRecommendationLabel } from '@/utils/scoring';
import { Recommendation } from '@/types';
import { Experiment } from '@/types';

export default function Review() {
  const navigate = useNavigate();
  const experiments = useAppStore((s) => s.experiments);
  const orders = useAppStore((s) => s.orders);
  const tasks = useAppStore((s) => s.tasks);
  const updateExperiment = useAppStore((s) => s.updateExperiment);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    experiments.filter(e => e.status === 'in_progress').slice(0, 3).map(e => e.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const experimentsWithAnalysis = useMemo(() => {
    return experiments
      .filter(e => e.status !== 'abandoned')
      .map(exp => {
        const analysis = getExperimentRecommendation(exp, orders, tasks);
        const expOrders = orders.filter(o => o.experimentId === exp.id);
        const revenue = expOrders.filter(o => o.type === 'sale').reduce((s, o) => s + o.amount, 0);
        const refunds = expOrders.filter(o => o.type === 'refund').reduce((s, o) => s + o.amount, 0);
        const costs = expOrders.filter(o => o.type === 'cost').reduce((s, o) => s + (o.cost || o.amount), 0);
        const expTasks = tasks.filter(t => t.experimentId === exp.id);
        return {
          exp,
          ...analysis,
          revenue: revenue - refunds,
          cost: costs,
          profit: revenue - refunds - costs,
          orderCount: expOrders.filter(o => o.type === 'sale').length,
          taskCount: expTasks.length,
          taskCompletion: expTasks.length > 0
            ? expTasks.filter(t => t.status === 'completed').length / expTasks.length * 100 : 0,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [experiments, orders, tasks]);

  const selectedExperiments = experimentsWithAnalysis.filter(a => selectedIds.includes(a.exp.id));

  const recommendationStats = useMemo(() => {
    const counts: Record<Recommendation, number> = { continue: 0, pause: 0, abandon: 0 };
    experimentsWithAnalysis.forEach(a => { counts[a.recommendation]++; });
    return counts;
  }, [experimentsWithAnalysis]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">🔍</span>
            复盘页
          </h1>
          <p className="text-slate-500 mt-1.5">
            用数据说话，理性决策每个实验的命运
          </p>
        </div>
      </div>

      {/* 决策概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            key: 'continue' as Recommendation,
            label: '建议继续',
            Icon: Check,
            count: recommendationStats.continue,
            bg: 'from-emerald-50 to-emerald-100/50',
            border: 'border-emerald-200',
            color: 'text-emerald-700',
          },
          {
            key: 'pause' as Recommendation,
            label: '建议暂停',
            Icon: Pause,
            count: recommendationStats.pause,
            bg: 'from-amber-50 to-amber-100/50',
            border: 'border-amber-200',
            color: 'text-amber-700',
          },
          {
            key: 'abandon' as Recommendation,
            label: '建议放弃',
            Icon: XCircle,
            count: recommendationStats.abandon,
            bg: 'from-coral-50 to-coral-100/50',
            border: 'border-coral-200',
            color: 'text-coral-700',
          },
        ].map(item => {
          const RecIcon = item.Icon;
          return (
            <div key={item.key} className={`lab-card p-5 bg-gradient-to-br ${item.bg} border-2 ${item.border}`}>
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${item.color}`}>
                  <RecIcon className="w-6 h-6" />
                </div>
                <div className="text-4xl font-bold font-mono opacity-90" style={{ color: item.color.replace('text-', '').includes('emerald') ? '#059669' : item.color.includes('amber') ? '#d97706' : '#dc2626' }}>
                  {item.count}
                </div>
              </div>
              <div className={`mt-4 text-lg font-bold ${item.color}`}>{item.label}</div>
              <div className="text-sm text-slate-500 mt-1">基于数据分析的建议数量</div>
            </div>
          );
        })}
      </div>

      {/* 对比选择 */}
      <div className="lab-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="section-title">
            <GitCompare className="w-5 h-5 text-lab-indigo-500" />
            多方案对比
            <span className="text-xs text-slate-400 font-normal ml-2">
              已选 {selectedExperiments.length}/5 个实验
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {experimentsWithAnalysis.map(a => {
            const selected = selectedIds.includes(a.exp.id);
            const recLabel = getRecommendationLabel(a.recommendation);
            return (
              <button
                key={a.exp.id}
                onClick={() => toggleSelect(a.exp.id)}
                className={`group px-3 py-2 rounded-xl border-2 transition-all text-left max-w-[220px] ${
                  selected
                    ? `${recLabel.bg} border-current`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selected
                      ? 'bg-lab-indigo-500 border-lab-indigo-500'
                      : 'border-slate-300 group-hover:border-lab-indigo-400'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-800 truncate">{a.exp.title}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium lab-badge ${recLabel.bg} ${recLabel.color}`}>
                    {recLabel.text}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{a.score}分</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 对比表格 */}
        {selectedExperiments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <GitCompare className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <p>请在上方选择至少 1 个实验进行对比</p>
          </div>
        ) : (
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-lab-indigo-50 to-lab-indigo-50/50 text-lab-indigo-700">
                    <th className="px-5 py-4 text-left font-semibold w-44 sticky left-0 bg-lab-indigo-50 z-10">对比维度</th>
                    {selectedExperiments.map(a => (
                      <th key={a.exp.id} className="px-5 py-4 text-center min-w-[180px]">
                        <button
                          onClick={() => navigate(`/experiments/${a.exp.id}`)}
                          className="font-bold text-lab-indigo-700 hover:underline hover:text-lab-indigo-600"
                        >
                          {a.exp.title}
                        </button>
                        <div className="mt-1.5 flex justify-center">
                          <span className={`lab-badge ${getRecommendationLabel(a.recommendation).bg} ${getRecommendationLabel(a.recommendation).color}`}>
                            <Sparkles className="w-3 h-3" />
                            {getRecommendationLabel(a.recommendation).text}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: '综合评分', icon: BarChart3, render: (a: any) => (
                      <div>
                        <span className="font-mono font-bold text-xl" style={{
                          color: a.score >= 65 ? '#059669' : a.score >= 40 ? '#d97706' : '#dc2626'
                        }}>{a.score}</span>
                        <span className="text-slate-400">/100</span>
                      </div>
                    )},
                    { label: '实验状态', icon: Target, render: (a: any) => {
                        const map: Record<string, string> = {
                          draft: '草稿', in_progress: '进行中', paused: '已暂停', completed: '已完成', abandoned: '已放弃'
                        };
                        return <span className="lab-badge bg-slate-100 text-slate-700">{map[a.exp.status]}</span>;
                    }},
                    { label: '完成进度', icon: BarChart2, render: (a: any) => (
                      <div className="max-w-[150px] mx-auto">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-gradient-to-r from-lab-amber-400 to-lab-amber-500 rounded-full"
                            style={{ width: `${a.exp.progress}%` }}></div>
                        </div>
                        <span className="font-mono text-xs text-slate-600">{a.exp.progress}%</span>
                      </div>
                    )},
                    { label: '累计收入', icon: TrendingUp, render: (a: any) => (
                      <span className="font-mono font-bold text-emerald-600">¥{a.revenue.toFixed(2)}</span>
                    )},
                    { label: '成本投入', icon: BarChart2, render: (a: any) => (
                      <span className="font-mono text-amber-700">¥{a.cost.toFixed(2)}</span>
                    )},
                    { label: '净利润', icon: TrendingUp, render: (a: any) => (
                      <span className={`font-mono font-bold text-lg ${a.profit >= 0 ? 'text-emerald-600' : 'text-coral-600'}`}>
                        ¥{a.profit.toFixed(2)}
                      </span>
                    )},
                    { label: '成交订单', icon: TrendingUp, render: (a: any) => (
                      <span className="font-mono text-slate-700">{a.orderCount} 单</span>
                    )},
                    { label: '任务完成', icon: BarChart2, render: (a: any) => (
                      <span className="font-mono text-slate-700">{a.taskCompletion.toFixed(0)}%</span>
                    )},
                    { label: '建议决策', icon: AlertCircle, render: (a: any) => {
                        const label = getRecommendationLabel(a.recommendation);
                        return <span className={`lab-badge border ${label.bg} ${label.color}`}>{label.text}</span>;
                    }},
                  ].map((row, idx) => {
                    const RowIcon = row.icon;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-slate-600 font-medium sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <RowIcon className="w-4 h-4 text-slate-400" />
                            {row.label}
                          </div>
                        </td>
                        {selectedExperiments.map(a => (
                          <td key={a.exp.id} className="px-5 py-4 text-center">
                            {row.render(a)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 每个实验的详细建议 */}
      <div className="space-y-4">
        <h3 className="section-title">
          <Sparkles className="w-5 h-5 text-lab-amber-500" />
          AI 决策建议详情
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experimentsWithAnalysis.map(a => {
            const recLabel = getRecommendationLabel(a.recommendation);
            const Icon = a.recommendation === 'continue' ? Check : a.recommendation === 'pause' ? Pause : XCircle;
            return (
              <div
                key={a.exp.id}
                className={`lab-card p-5 border-l-4 ${
                  a.recommendation === 'continue' ? '!border-l-emerald-500' :
                  a.recommendation === 'pause' ? '!border-l-amber-500' : '!border-l-coral-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{a.exp.title}</h4>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>综合评分</span>
                      <span className="font-mono font-bold text-slate-600">{a.score}/100</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/experiments/${a.exp.id}`)}
                    className="ml-2 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${recLabel.bg} ${recLabel.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">{recLabel.text}</span>
                </div>

                <div className="mt-4 space-y-2">
                  {a.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={`w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${
                        reason.includes('盈利') || reason.includes('收入') || reason.includes('完成率高')
                          ? 'bg-emerald-500'
                          : reason.includes('尚无') || reason.includes('过高') || reason.includes('缓慢') || reason.includes('超过')
                          ? 'bg-coral-500'
                          : 'bg-amber-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {a.exp.status === 'in_progress' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                    {a.recommendation !== 'continue' && (
                      <button
                        onClick={() => updateExperiment(a.exp.id, { status: 'paused' })}
                        className="flex-1 lab-btn-secondary !py-1.5 !text-xs !text-amber-700 !border-amber-300 hover:!bg-amber-50"
                      >
                        <Pause className="w-3 h-3" />
                        暂停实验
                      </button>
                    )}
                    {a.recommendation === 'abandon' && (
                      <button
                        onClick={() => {
                          if (confirm('确认放弃此实验？')) {
                            updateExperiment(a.exp.id, { status: 'abandoned' });
                          }
                        }}
                        className="flex-1 lab-btn-secondary !py-1.5 !text-xs !text-coral-700 !border-coral-300 hover:!bg-coral-50"
                      >
                        <XCircle className="w-3 h-3" />
                        放弃实验
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
