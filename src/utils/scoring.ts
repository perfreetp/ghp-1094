import { Idea, Experiment, Order, Task, Recommendation } from '@/types';

export function calculateIdeaScore(idea: Idea): number {
  const costWeight = 0.35;
  const cycleWeight = 0.3;
  const interestWeight = 0.35;

  const normalizedCost = (6 - idea.costScore) / 5;
  const normalizedCycle = (6 - idea.cycleScore) / 5;
  const normalizedInterest = idea.interestScore / 5;

  const score = (normalizedCost * costWeight + normalizedCycle * cycleWeight + normalizedInterest * interestWeight) * 100;
  return Math.round(score);
}

export function sortIdeasByScore(ideas: Idea[]): Idea[] {
  return [...ideas].sort((a, b) => calculateIdeaScore(b) - calculateIdeaScore(a));
}

export function getExperimentRecommendation(
  experiment: Experiment,
  orders: Order[],
  tasks: Task[]
): { recommendation: Recommendation; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50;

  const experimentOrders = orders.filter(o => o.experimentId === experiment.id);
  const revenue = experimentOrders
    .filter(o => o.type === 'sale')
    .reduce((sum, o) => sum + o.amount, 0);
  const refunds = experimentOrders
    .filter(o => o.type === 'refund')
    .reduce((sum, o) => sum + o.amount, 0);
  const costs = experimentOrders
    .filter(o => o.type === 'cost')
    .reduce((sum, o) => sum + (o.cost || o.amount), 0);
  const profit = revenue - refunds - costs;

  const experimentTasks = tasks.filter(t => t.experimentId === experiment.id);
  const completedTasks = experimentTasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = experimentTasks.length > 0 ? completedTasks / experimentTasks.length : 0;

  if (profit > 0) {
    score += 25;
    reasons.push(`已盈利 ¥${profit.toFixed(2)}，正向现金流`);
  } else if (revenue > 0) {
    score += 10;
    reasons.push(`已有收入 ¥${revenue.toFixed(2)}，但尚未盈利`);
  } else {
    score -= 15;
    reasons.push('尚无任何收入');
  }

  const refundRate = revenue > 0 ? refunds / revenue : 0;
  if (refundRate > 0.3) {
    score -= 15;
    reasons.push(`退款率过高 (${(refundRate * 100).toFixed(0)}%)`);
  } else if (refundRate > 0) {
    reasons.push(`退款率 ${(refundRate * 100).toFixed(0)}%，在可控范围`);
  }

  if (taskCompletionRate >= 0.8) {
    score += 10;
    reasons.push(`任务完成率高 (${(taskCompletionRate * 100).toFixed(0)}%)`);
  } else if (taskCompletionRate < 0.3 && experimentTasks.length > 3) {
    score -= 10;
    reasons.push(`任务推进缓慢 (${(taskCompletionRate * 100).toFixed(0)}%)`);
  }

  if (experiment.progress >= 80) {
    score += 5;
    reasons.push('实验进度已达 80% 以上');
  }

  const daysRunning = Math.floor((Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysRunning > 30 && revenue === 0) {
    score -= 20;
    reasons.push('运行超过 30 天仍无收入');
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation: Recommendation;
  if (score >= 65) {
    recommendation = 'continue';
    if (reasons.length === 0) reasons.push('综合表现良好，建议继续投入');
  } else if (score >= 40) {
    recommendation = 'pause';
    if (reasons.length === 0) reasons.push('表现中规中矩，建议暂停观察');
  } else {
    recommendation = 'abandon';
    if (reasons.length === 0) reasons.push('多项指标不佳，建议止损放弃');
  }

  return { recommendation, score, reasons };
}

export function getRecommendationLabel(r: Recommendation): { text: string; color: string; bg: string } {
  switch (r) {
    case 'continue':
      return { text: '继续投入', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    case 'pause':
      return { text: '暂停观察', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    case 'abandon':
      return { text: '建议放弃', color: 'text-coral-700', bg: 'bg-coral-50 border-coral-200' };
  }
}
