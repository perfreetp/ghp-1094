import { Order, Experiment, Task, ChannelRecord, Interview, Metric } from '@/types';
import { isThisMonth, isThisWeek, isOverdue } from './date';

export interface FinanceBreakdown {
  sales: number;
  refunds: number;
  costs: number;
  revenue: number;
  profit: number;
  orderCount: number;
  refundRate: number;
  avgOrderValue: number;
}

const DEFAULT: FinanceBreakdown = {
  sales: 0,
  refunds: 0,
  costs: 0,
  revenue: 0,
  profit: 0,
  orderCount: 0,
  refundRate: 0,
  avgOrderValue: 0,
};

function calculateBreakdown(
  orders: Order[],
  scope: 'all' | 'month' | 'week' = 'all'
): FinanceBreakdown {
  const filtered = orders.filter((o) => {
    if (scope === 'month') return isThisMonth(o.date);
    if (scope === 'week') return isThisWeek(o.date);
    return true;
  });
  const sales = filtered.filter((o) => o.type === 'sale').reduce((s, o) => s + o.amount, 0);
  const refunds = filtered.filter((o) => o.type === 'refund').reduce((s, o) => s + o.amount, 0);
  const costs = filtered
    .filter((o) => o.type === 'cost')
    .reduce((s, o) => s + (o.cost != null ? o.cost : o.amount), 0);
  const orderCount = filtered.filter((o) => o.type === 'sale').length;
  const revenue = sales - refunds;
  const profit = revenue - costs;
  const refundRate = sales > 0 ? (refunds / sales) * 100 : 0;
  const avgOrderValue = orderCount > 0 ? sales / orderCount : 0;
  return {
    sales,
    refunds,
    costs,
    revenue,
    profit,
    orderCount,
    refundRate,
    avgOrderValue,
  };
}

function calculateExperimentFinance(expId: string | null, orders: Order[]): FinanceBreakdown {
  return calculateBreakdown(
    orders.filter((o) => o.experimentId === expId),
    'all'
  );
}

function computeMetricStatus(metric: Metric): 'pending' | 'on_track' | 'achieved' | 'at_risk' | 'failed' {
  const ratio = metric.target > 0 ? metric.current / metric.target : 0;
  const overdue = metric.deadline ? isOverdue(metric.deadline) : false;

  if (metric.current >= metric.target) return 'achieved';
  if (overdue) return ratio < 0.3 ? 'failed' : 'at_risk';
  if (ratio >= 0.7) return 'on_track';
  if (ratio >= 0.3) return 'at_risk';
  return 'pending';
}

export interface RecommendationEvidence {
  category: 'finance' | 'tasks' | 'metrics' | 'channels' | 'interviews';
  label: string;
  positive: boolean;
  points: string[];
}

export interface FullAnalysis {
  recommendation: 'continue' | 'pause' | 'abandon';
  score: number;
  reasons: string[];
  evidence: RecommendationEvidence[];
}

interface RecommendationInputs {
  experiment: Experiment;
  orders: Order[];
  tasks: Task[];
  metrics?: Metric[];
  channels?: ChannelRecord[];
  interviews?: Interview[];
}

function getFullRecommendation({
  experiment,
  orders,
  tasks,
  metrics = [],
  channels = [],
  interviews = [],
}: RecommendationInputs): FullAnalysis {
  let score = 50;
  const reasons: string[] = [];
  const evidence: RecommendationEvidence[] = [];

  // ========= 1. 财务证据
  const fin = calculateExperimentFinance(experiment.id, orders);
  const financeEvidence: RecommendationEvidence = {
    category: 'finance',
    label: '财务表现',
    positive: true,
    points: [],
  };

  if (fin.profit > 0) {
    score += 20;
    reasons.push(`已盈利 ¥${fin.profit.toFixed(2)}，正向现金流`);
    financeEvidence.positive = true;
    financeEvidence.points.push(`净利润 ¥${fin.profit.toFixed(2)}`);
  } else if (fin.sales > 0) {
    score += 8;
    reasons.push(`已有收入 ¥${fin.sales.toFixed(2)}，但尚未盈利`);
    financeEvidence.positive = true;
    financeEvidence.points.push(
      `累计收入 ¥${fin.sales.toFixed(2)}，成本 ¥${fin.costs.toFixed(2)}`
    );
  } else {
    score -= 12;
    reasons.push('尚无任何收入');
    financeEvidence.positive = false;
    financeEvidence.points.push('暂无销售收入');
  }
  if (fin.refundRate > 30) {
    score -= 10;
    reasons.push(`退款率过高 (${fin.refundRate.toFixed(0)}%)`);
    financeEvidence.positive = false;
    financeEvidence.points.push(`退款率 ${fin.refundRate.toFixed(1)}%`);
  } else if (fin.refundRate > 0) {
    financeEvidence.points.push(`退款率 ${fin.refundRate.toFixed(1)}%，在可控范围`);
  }
  if (fin.orderCount > 0) {
    financeEvidence.points.push(
      `成交 ${fin.orderCount} 单，客单价 ¥${fin.avgOrderValue.toFixed(0)}`
    );
  }
  evidence.push(financeEvidence);

  // ========= 2. 任务证据
  const taskEvidence: RecommendationEvidence = {
    category: 'tasks',
    label: '任务推进',
    positive: true,
    points: [],
  };
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && isOverdue(t.dueDate)
  ).length;

  if (taskCompletionRate >= 0.8) {
    score += 8;
    reasons.push(`任务完成率高 (${(taskCompletionRate * 100).toFixed(0)}%)`);
    taskEvidence.positive = true;
  } else if (taskCompletionRate < 0.3 && tasks.length > 3) {
    score -= 8;
    reasons.push(`任务推进缓慢 (${(taskCompletionRate * 100).toFixed(0)}%)`);
    taskEvidence.positive = false;
  }
  if (overdueCount > 0) {
    score -= overdueCount * 2;
    taskEvidence.positive = false;
    taskEvidence.points.push(`${overdueCount} 个任务已超期`);
  }
  taskEvidence.points.push(
    `完成 ${completedTasks}/${tasks.length} 项 (${(taskCompletionRate * 100).toFixed(0)}%)`
  );
  evidence.push(taskEvidence);

  // ========= 3. 验证指标证据
  const metricEvidence: RecommendationEvidence = {
    category: 'metrics',
    label: '验证指标',
    positive: true,
    points: [],
  };
  if (metrics.length > 0) {
    const achieved = metrics.filter((m) => m.current >= m.target).length;
    const atRisk = metrics.filter((m) => {
      const r = m.target > 0 ? m.current / m.target : 0;
      return m.deadline && isOverdue(m.deadline) && r < 0.5;
    }).length;
    const avgMetricProgress =
      metrics.length > 0
        ? (metrics.reduce(
            (s, m) => s + (m.target > 0 ? Math.min(1, m.current / m.target) : 0),
            0
          ) /
            metrics.length) *
          100
        : 0;

    metricEvidence.points.push(`指标平均完成率 ${avgMetricProgress.toFixed(0)}%`);
    metricEvidence.points.push(`已达标 ${achieved}/${metrics.length} 项`);

    if (achieved > 0) {
      score += achieved * 5;
      reasons.push(`${achieved} 个验证指标已达标`);
      metricEvidence.positive = true;
    }
    if (atRisk > 0) {
      score -= atRisk * 5;
      reasons.push(`${atRisk} 个指标到期未达标`);
      metricEvidence.positive = false;
    }
    if (avgMetricProgress >= 60) {
      score += 5;
    } else if (avgMetricProgress < 20 && metrics.length >= 2) {
      score -= 5;
    }
  } else {
    metricEvidence.points.push('尚未设置验证指标');
  }
  evidence.push(metricEvidence);

  // ========= 4. 渠道证据
  const channelEvidence: RecommendationEvidence = {
    category: 'channels',
    label: '渠道运营',
    positive: true,
    points: [],
  };
  if (channels.length > 0) {
    const totalViews = channels.reduce((s, c) => s + (c.metrics.views || 0), 0);
    const totalClicks = channels.reduce((s, c) => s + (c.metrics.clicks || 0), 0);
    const totalConversions = channels.reduce((s, c) => s + (c.metrics.conversions || 0), 0);
    const totalBudget = channels
      .filter((c) => c.type === 'ads')
      .reduce((s, c) => s + (c.metrics.budget || 0), 0);
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    channelEvidence.points.push(`${channels.length} 条渠道动作，曝光 ${totalViews}`);
    if (totalConversions > 0) {
      channelEvidence.points.push(`转化 ${totalConversions} 单`);
      score += Math.min(totalConversions * 2, 10);
      reasons.push(`渠道转化 ${totalConversions} 单，引流有效`);
      channelEvidence.positive = true;
    }
    if (totalBudget > 0 && totalConversions > 0) {
      const cpa = totalBudget / totalConversions;
      channelEvidence.points.push(`投放获客成本 ¥${cpa.toFixed(1)}`);
    }
    if (ctr >= 3) {
      channelEvidence.points.push(`点击率 ${ctr.toFixed(2)}% 表现良好`);
    }
  } else {
    channelEvidence.points.push('暂无渠道数据');
  }
  evidence.push(channelEvidence);

  // ========= 5. 访谈证据
  const interviewEvidence: RecommendationEvidence = {
    category: 'interviews',
    label: '用户访谈',
    positive: interviews.length > 0,
    points: [],
  };
  if (interviews.length > 0) {
    interviewEvidence.points.push(`${interviews.length} 场用户访谈`);
    const questionCount = interviews.reduce((s, i) => s + i.questions.length, 0);
    interviewEvidence.points.push(`收集 ${questionCount} 个用户问题`);
    if (interviews.length >= 3) {
      score += 5;
      reasons.push(`已完成 ${interviews.length} 场用户访谈，用户需求明确`);
    }
  } else {
    interviewEvidence.points.push('建议补充用户访谈');
  }
  evidence.push(interviewEvidence);

  // ========= 进度和运行天数
  const daysRunning = Math.floor(
    (Date.now() - new Date(experiment.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (daysRunning > 30 && fin.sales === 0) {
    score -= 15;
    reasons.push('运行超过 30 天仍无收入');
  }
  if (experiment.progress >= 80) {
    score += 5;
    reasons.push('实验进度已达 80% 以上');
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation: 'continue' | 'pause' | 'abandon';
  if (score >= 65) recommendation = 'continue';
  else if (score >= 40) recommendation = 'pause';
  else recommendation = 'abandon';

  if (reasons.length === 0) {
    reasons.push('综合评估');
  }

  return { recommendation, score, reasons, evidence };
}

export {
  calculateBreakdown,
  calculateExperimentFinance,
  computeMetricStatus,
  getFullRecommendation,
  DEFAULT as DEFAULT_FINANCE,
};
