import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FlaskConical, Filter, Play, Pause, CheckCircle2,
  FileX, MoreHorizontal, TrendingUp, Calendar, DollarSign
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ExperimentStatus, Experiment } from '@/types';
import { formatDate } from '@/utils/date';

const statusFilters: { key: ExperimentStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: 'bg-slate-100 text-slate-700' },
  { key: 'in_progress', label: '进行中', color: 'bg-amber-100 text-amber-700' },
  { key: 'draft', label: '草稿', color: 'bg-slate-100 text-slate-600' },
  { key: 'paused', label: '已暂停', color: 'bg-slate-200 text-slate-600' },
  { key: 'completed', label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'abandoned', label: '已放弃', color: 'bg-coral-100 text-coral-700' },
];

const statusInfo: Record<ExperimentStatus, { text: string; color: string; bg: string; icon: any }> = {
  draft: { text: '草稿', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileX },
  in_progress: { text: '进行中', color: 'text-amber-700', bg: 'bg-amber-100', icon: Play },
  paused: { text: '已暂停', color: 'text-slate-600', bg: 'bg-slate-200', icon: Pause },
  completed: { text: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  abandoned: { text: '已放弃', color: 'text-coral-700', bg: 'bg-coral-100', icon: FileX },
};

export default function Experiments() {
  const navigate = useNavigate();
  const experiments = useAppStore((s) => s.experiments);
  const addExperiment = useAppStore((s) => s.addExperiment);
  const getExperimentProfit = useAppStore((s) => s.getExperimentProfit);
  const getTasksByExperiment = useAppStore((s) => s.getTasksByExperiment);
  const getOrdersByExperiment = useAppStore((s) => s.getOrdersByExperiment);
  const getMetricsByExperiment = useAppStore((s) => s.getMetricsByExperiment);

  const [filter, setFilter] = useState<ExperimentStatus | 'all'>('all');

  const filteredExperiments = experiments.filter(
    (e) => filter === 'all' || e.status === filter
  );

  const handleCreateNew = () => {
    const today = new Date();
    const endDate = new Date(today.getTime() + 30 * 86400000);
    const newExp: Omit<Experiment, 'id'> = {
      ideaId: null,
      title: '新实验项目',
      status: 'draft',
      targetAudience: '',
      price: 0,
      channels: [],
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      progress: 0,
      description: '',
    };
    addExperiment(newExp);
    const justAdded = useAppStore.getState().experiments[0];
    navigate(`/experiments/${justAdded.id}`);
  };

  const getStats = (exp: Experiment) => {
    const tasks = getTasksByExperiment(exp.id);
    const orders = getOrdersByExperiment(exp.id);
    const metrics = getMetricsByExperiment(exp.id);
    const profit = getExperimentProfit(exp.id);
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const sales = orders.filter((o) => o.type === 'sale').length;
    const achievedMetrics = metrics.filter((m) => m.current >= m.target).length;
    const avgMetricProgress = metrics.length > 0
      ? (metrics.reduce((s, m) => s + (m.target > 0 ? Math.min(1, m.current / m.target) : 0), 0) / metrics.length) * 100
      : 0;
    return {
      profit,
      completedTasks,
      totalTasks: tasks.length,
      sales,
      metrics,
      achievedMetrics,
      totalMetrics: metrics.length,
      avgMetricProgress,
    };
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">🧪</span>
            实验卡
          </h1>
          <p className="text-slate-500 mt-1.5">
            管理所有副业实验，科学验证每个想法
          </p>
        </div>
        <button onClick={handleCreateNew} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          新建实验
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`lab-badge cursor-pointer transition-all ${
              filter === f.key
                ? '!bg-lab-indigo-500 !text-white shadow-sm scale-105'
                : f.color + ' hover:scale-105'
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-70">
              ({f.key === 'all'
                ? experiments.length
                : experiments.filter((e) => e.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* 实验列表 */}
      {filteredExperiments.length === 0 ? (
        <div className="lab-card p-16 text-center">
          <FlaskConical className="w-20 h-20 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {filter === 'all' ? '还没有任何实验' : '当前分类暂无实验'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            每个副业想法都是一次实验，用数据验证它是否可行
          </p>
          <button onClick={handleCreateNew} className="lab-btn-primary">
            <FlaskConical className="w-4 h-4" />
            创建第一个实验
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredExperiments.map((exp) => {
            const info = statusInfo[exp.status];
            const StatIcon = info.icon;
            const stats = getStats(exp);
            return (
              <div
                key={exp.id}
                onClick={() => navigate(`/experiments/${exp.id}`)}
                className="lab-card p-6 cursor-pointer group relative overflow-hidden"
              >
                {/* 左侧色条 */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2 ${
                    exp.status === 'in_progress'
                      ? 'bg-gradient-to-b from-lab-amber-400 to-lab-amber-600'
                      : exp.status === 'completed'
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                      : exp.status === 'abandoned'
                      ? 'bg-gradient-to-b from-coral-400 to-coral-600'
                      : 'bg-slate-300'
                  }`}
                ></div>

                <div className="mb-5 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-lab-indigo-600 transition-colors">
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(exp.startDate)} ~ {formatDate(exp.endDate)}
                      </span>
                    </div>
                  </div>
                  <span className={`lab-badge gap-1 ${info.bg} ${info.color}`}>
                    <StatIcon className="w-3 h-3" />
                    {info.text}
                  </span>
                </div>

                {/* 描述 */}
                {exp.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {exp.description}
                  </p>
                )}

                {/* 进度条 */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">实验进度</span>
                    <span className="font-mono font-bold text-slate-700">{exp.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        exp.progress >= 80
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-lab-amber-400 to-lab-amber-500'
                      }`}
                      style={{ width: `${exp.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 数据指标 */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      净利润
                    </div>
                    <div
                      className={`font-bold font-mono ${
                        stats.profit >= 0 ? 'text-emerald-600' : 'text-coral-600'
                      }`}
                    >
                      ¥{stats.profit.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      成交
                    </div>
                    <div className="font-bold font-mono text-slate-800">{stats.sales}单</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">任务进度</div>
                    <div className="font-bold font-mono text-slate-800">
                      {stats.completedTasks}/{stats.totalTasks}
                    </div>
                  </div>
                </div>

                {/* 验证指标摘要 */}
                {stats.totalMetrics > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1">
                        📏 验证指标
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {stats.achievedMetrics}项已达标 / 共{stats.totalMetrics}项 ({stats.avgMetricProgress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stats.avgMetricProgress >= 80
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : stats.avgMetricProgress >= 50
                            ? 'bg-gradient-to-r from-lab-indigo-400 to-lab-indigo-500'
                            : 'bg-gradient-to-r from-lab-amber-400 to-lab-amber-500'
                        }`}
                        style={{ width: `${stats.avgMetricProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button className="absolute top-5 right-5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
