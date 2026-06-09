import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, TrendingUp, CheckSquare, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Play, Clock, XCircle,
  DollarSign, Target, Calendar, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/date';
import { Experiment } from '@/types';

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}) {
  return (
    <div className="lab-card p-5 relative overflow-hidden group">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: color }}
      ></div>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-coral-600' : 'text-slate-500'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
              {subValue}
            </span>
          )}
        </div>
        <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight mb-1">
          {value}
        </div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function ExperimentCard({ exp, onClick }: { exp: Experiment; onClick: () => void }) {
  const getOrdersByExperiment = useAppStore((s) => s.getOrdersByExperiment);
  const getExperimentProfit = useAppStore((s) => s.getExperimentProfit);
  const getTasksByExperiment = useAppStore((s) => s.getTasksByExperiment);

  const orders = getOrdersByExperiment(exp.id);
  const profit = getExperimentProfit(exp.id);
  const tasks = getTasksByExperiment(exp.id);
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const sales = orders.filter((o) => o.type === 'sale').length;

  const statusMap: Record<string, { text: string; color: string; bg: string }> = {
    draft: { text: '草稿', color: 'text-slate-600', bg: 'bg-slate-100' },
    in_progress: { text: '进行中', color: 'text-amber-700', bg: 'bg-amber-100' },
    paused: { text: '已暂停', color: 'text-slate-600', bg: 'bg-slate-200' },
    completed: { text: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    abandoned: { text: '已放弃', color: 'text-coral-700', bg: 'bg-coral-100' },
  };
  const status = statusMap[exp.status];

  return (
    <div
      onClick={onClick}
      className="lab-card p-5 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-lab-amber-500 group-hover:w-1.5 transition-all"></div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-lab-indigo-600 transition-colors">
            {exp.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {formatDate(exp.startDate)} 启动
          </div>
        </div>
        <span className={`lab-badge ${status.bg} ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>实验进度</span>
          <span className="font-mono font-semibold text-slate-700">{exp.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lab-amber-400 to-lab-amber-500 rounded-full transition-all"
            style={{ width: `${exp.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">成交</div>
          <div className="font-bold text-slate-800 font-mono">{sales}单</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">利润</div>
          <div className={`font-bold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-coral-600'}`}>
            ¥{profit.toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">任务</div>
          <div className="font-bold text-slate-800 font-mono">{completedTasks}/{tasks.length}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const getActiveExperiments = useAppStore((s) => s.getActiveExperiments);
  const getMonthlyRevenue = useAppStore((s) => s.getMonthlyRevenue);
  const getTotalRevenue = useAppStore((s) => s.getTotalRevenue);
  const getTodayTasks = useAppStore((s) => s.getTodayTasks);
  const getRisks = useAppStore((s) => s.getRisks);
  const getRevenueTrend = useAppStore((s) => s.getRevenueTrend);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const experiments = useAppStore((s) => s.experiments);

  const activeExps = getActiveExperiments();
  const monthlyRevenue = getMonthlyRevenue();
  const totalRevenue = getTotalRevenue();
  const todayTasks = getTodayTasks();
  const risks = getRisks();
  const revenueTrend = getRevenueTrend(30);
  const todoCount = todayTasks.length;
  const riskCount = risks.length;

  const totalProfit = useMemo(() => {
    const orders = useAppStore.getState().orders;
    const costs = orders
      .filter((o) => o.type === 'cost')
      .reduce((s, o) => s + (o.cost || o.amount), 0);
    const refunds = orders
      .filter((o) => o.type === 'refund')
      .reduce((s, o) => s + o.amount, 0);
    return totalRevenue - costs - refunds;
  }, [totalRevenue]);

  const priorityColors: Record<string, string> = {
    high: 'bg-coral-500',
    medium: 'bg-lab-amber-500',
    low: 'bg-slate-400',
  };
  const priorityLabels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const riskLevelStyles: Record<string, { bg: string; color: string; icon: any }> = {
    high: { bg: 'bg-coral-50 border-coral-200', color: 'text-coral-700', icon: XCircle },
    medium: { bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700', icon: AlertCircle },
    low: { bg: 'bg-slate-50 border-slate-200', color: 'text-slate-600', icon: AlertTriangle },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">🧪</span>
            主控台
          </h1>
          <p className="text-slate-500 mt-1.5">
            {formatDate(new Date(), 'chinese')} · 欢迎回到你的副业实验室
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/ideas')}
            className="lab-btn-secondary"
          >
            <Target className="w-4 h-4" />
            记录灵感
          </button>
          <button
            onClick={() => navigate('/experiments')}
            className="lab-btn-primary"
          >
            <FlaskConical className="w-4 h-4" />
            新建实验
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FlaskConical}
          label="进行中实验"
          value={String(activeExps.length)}
          subValue={`共 ${experiments.length} 个`}
          trend="neutral"
          color="#1e3a5f"
        />
        <StatCard
          icon={DollarSign}
          label="本月收入"
          value={`¥${monthlyRevenue.toFixed(0)}`}
          subValue={monthlyRevenue > 0 ? '增长中' : '新的开始'}
          trend={monthlyRevenue > 0 ? 'up' : 'neutral'}
          color="#10b981"
        />
        <StatCard
          icon={CheckSquare}
          label="今日待办"
          value={String(todoCount)}
          subValue={todoCount > 3 ? '任务较多' : '节奏不错'}
          trend={todoCount > 3 ? 'down' : 'up'}
          color="#f59e0b"
        />
        <StatCard
          icon={AlertTriangle}
          label="风险提醒"
          value={String(riskCount)}
          subValue={riskCount > 0 ? '需关注' : '无风险'}
          trend={riskCount > 0 ? 'down' : 'up'}
          color="#ef4444"
        />
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 收入趋势图 */}
        <div className="lg:col-span-2 lab-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                近30天收入趋势
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                累计收入 ¥{totalRevenue.toFixed(2)} ·
                净利润 <span className={totalProfit >= 0 ? 'text-emerald-600 font-medium' : 'text-coral-600 font-medium'}>
                  ¥{totalProfit.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-lab-amber-400 to-lab-amber-500"></span>
              每日净收入
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v > 0 ? `¥${v}` : ''}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '收入']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 今日待办 */}
        <div className="lab-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <CheckSquare className="w-5 h-5 text-lab-amber-500" />
              今日待办
            </h2>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-lab-indigo-600 hover:underline font-medium"
            >
              查看全部 →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
            {todayTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
                <Clock className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm">今日暂无待办任务</p>
                <p className="text-xs mt-1">去日历页添加任务吧～</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskComplete(task.id)}
                      className="w-4 h-4 rounded border-slate-300 text-lab-indigo-500 focus:ring-lab-indigo-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        task.status === 'completed'
                          ? 'line-through text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`}></span>
                      <span className="text-xs text-slate-400">{priorityLabels[task.priority]}优先级</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 当前实验 + 风险提醒 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 当前实验 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <FlaskConical className="w-5 h-5 text-lab-indigo-500" />
              当前实验
            </h2>
            <button
              onClick={() => navigate('/experiments')}
              className="text-xs text-lab-indigo-600 hover:underline font-medium"
            >
              全部实验 →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeExps.length === 0 ? (
              <div className="md:col-span-2 lab-card p-10 text-center text-slate-400">
                <FlaskConical className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">还没有进行中的实验</p>
                <p className="text-sm mt-1">从灵感池挑一个点子开始吧！</p>
                <button
                  onClick={() => navigate('/ideas')}
                  className="lab-btn-primary mt-4"
                >
                  <Play className="w-4 h-4" />
                  探索灵感
                </button>
              </div>
            ) : (
              activeExps.map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  exp={exp}
                  onClick={() => navigate(`/experiments/${exp.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* 风险提醒 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <AlertTriangle className="w-5 h-5 text-coral-500" />
              风险提醒
            </h2>
          </div>
          <div className="space-y-3">
            {risks.length === 0 ? (
              <div className="lab-card p-8 text-center text-slate-400">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-sm">一切顺利，暂无风险</p>
                <p className="text-xs mt-1">继续保持～</p>
              </div>
            ) : (
              risks.map((risk) => {
                const style = riskLevelStyles[risk.level];
                const RiskIcon = style.icon;
                return (
                  <div
                    key={risk.id}
                    className={`p-4 rounded-xl border ${style.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <RiskIcon className={`w-5 h-5 mt-0.5 ${style.color} shrink-0`} />
                      <div>
                        <div className={`text-sm font-medium ${style.color}`}>
                          {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
                        </div>
                        <p className="text-sm text-slate-700 mt-0.5">{risk.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
