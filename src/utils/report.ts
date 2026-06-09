import {
  Idea, Experiment, Task, ChannelRecord, Interview, Order, Material, Metric
} from '@/types';
import { formatDate, getWeekRange, isThisWeek } from './date';
import { calculateBreakdown, computeMetricStatus } from './finance';

interface ReportData {
  ideas: Idea[];
  experiments: Experiment[];
  tasks: Task[];
  channelRecords: ChannelRecord[];
  interviews: Interview[];
  orders: Order[];
  materials: Material[];
  metrics?: Metric[];
}

export function generateWeeklyReport(data: ReportData): string {
  const { start, end } = getWeekRange();
  const weekLabel = `${formatDate(start, 'chinese')} - ${formatDate(end, 'chinese')}`;

  const weekExperiments = data.experiments.filter(e => {
    const s = new Date(e.startDate);
    return s <= end && new Date(e.endDate) >= start;
  });

  const weekTasks = data.tasks.filter(t => isThisWeek(t.dueDate));
  const completedTasks = weekTasks.filter(t => t.status === 'completed');
  const pendingTasks = weekTasks.filter(t => t.status !== 'completed');

  const weekOrders = data.orders.filter(o => isThisWeek(o.date));
  const fin = calculateBreakdown(weekOrders, 'all');

  const weekChannelRecords = data.channelRecords.filter(r => isThisWeek(r.date));
  const weekInterviews = data.interviews.filter(i => isThisWeek(i.date));

  const weekMetrics = (data.metrics || []).filter(m =>
    weekExperiments.some(e => e.id === m.experimentId)
  );

  const topExperiments = data.experiments
    .filter(e => e.status === 'in_progress')
    .map(exp => {
      const expWeekOrders = data.orders.filter(o => o.experimentId === exp.id && isThisWeek(o.date));
      const expFin = calculateBreakdown(expWeekOrders, 'all');
      return { ...exp, revenue: expFin.revenue, profit: expFin.profit };
    })
    .sort((a, b) => b.revenue - a.revenue);

  let report = `# 📊 副业实验室 · 周工作报告\n\n`;
  report += `**报告周期**：${weekLabel}\n\n`;
  report += `---\n\n`;

  report += `## 💰 本周财务概览\n\n`;
  report += `| 指标 | 金额 |\n|------|------|\n| 💰 销售收入 | ¥${fin.sales.toFixed(2)} |\n| 💸 退款金额 | ¥${fin.refunds.toFixed(2)} |\n| 📦 成本支出 | ¥${fin.costs.toFixed(2)} |\n| 🧮 净收入（收入-退款） | ¥${fin.revenue.toFixed(2)} |\n| 📈 净利润（净收入-成本） | **¥${fin.profit.toFixed(2)}** |\n| 🧾 成交订单数 | ${fin.orderCount} 单 |\n| 🔄 退款率 | ${fin.refundRate.toFixed(1)}% |\n| 💵 客单价 | ¥${fin.avgOrderValue.toFixed(2)} |\n\n`;

  report += `## 🧪 进行中实验\n\n`;
  if (topExperiments.length === 0) {
    report += `> 暂无进行中的实验\n\n`;
  } else {
    report += `| 实验名称 | 进度 | 本周净收入 | 本周净利润 | 状态 |\n|----------|------|------------|------------|------|\n`;
    topExperiments.forEach(e => {
      const statusText: Record<string, string> = {
        draft: '草稿', in_progress: '进行中', paused: '暂停',
        completed: '完成', abandoned: '放弃'
      };
      report += `| ${e.title} | ${e.progress}% | ¥${e.revenue.toFixed(2)} | ¥${e.profit.toFixed(2)} | ${statusText[e.status] || e.status} |\n`;
    });
    report += `\n`;
  }

  if (weekMetrics.length > 0) {
    report += `## 📏 验证指标周报\n\n`;
    report += `| 指标名称 | 所属实验 | 目标 | 当前 | 完成率 | 状态 | 截止日期 |\n|----------|----------|------|------|--------|------|----------|\n`;
    weekMetrics.forEach(m => {
      const exp = data.experiments.find(e => e.id === m.experimentId);
      const ratio = m.target > 0 ? Math.min(100, m.current / m.target * 100) : 0;
      const st = computeMetricStatus(m);
      const statusText: Record<string, string> = {
        pending: '⏳ 待启动', on_track: '✅ 正常', achieved: '🏆 已达标',
        at_risk: '⚠️ 有风险', failed: '❌ 未达标'
      };
      report += `| ${m.name} | ${exp?.title || '-'} | ${m.target}${m.unit || ''} | ${m.current}${m.unit || ''} | ${ratio.toFixed(0)}% | ${statusText[st] || st} | ${m.deadline ? formatDate(m.deadline) : '-'} |\n`;
    });
    report += `\n`;
  }

  report += `## ✅ 任务完成情况\n\n`;
  report += `- 本周任务总数：${weekTasks.length} 项\n`;
  report += `- ✅ 已完成：${completedTasks.length} 项\n`;
  report += `- ⏳ 待处理：${pendingTasks.length} 项\n`;
  report += `- 📊 完成率：${weekTasks.length > 0 ? Math.round(completedTasks.length / weekTasks.length * 100) : 0}%\n\n`;

  if (completedTasks.length > 0) {
    report += `**本周完成的关键任务：**\n\n`;
    completedTasks.forEach(t => {
      const exp = data.experiments.find(e => e.id === t.experimentId);
      report += `- ✅ ${t.title}${exp ? `（${exp.title}）` : ''}\n`;
    });
    report += `\n`;
  }

  if (pendingTasks.length > 0) {
    report += `**下周需要跟进的任务：**\n\n`;
    pendingTasks.slice(0, 10).forEach(t => {
      const exp = data.experiments.find(e => e.id === t.experimentId);
      const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
      report += `- ${priority} ${t.title}${exp ? `（${exp.title}）` : ''} - 截止 ${formatDate(t.dueDate)}\n`;
    });
    report += `\n`;
  }

  report += `## 📣 渠道运营记录\n\n`;
  if (weekChannelRecords.length === 0) {
    report += `> 本周暂无渠道记录\n\n`;
  } else {
    const totalViews = weekChannelRecords.reduce((s, r) => s + (r.metrics.views || 0), 0);
    const totalClicks = weekChannelRecords.reduce((s, r) => s + (r.metrics.clicks || 0), 0);
    const totalConversions = weekChannelRecords.reduce((s, r) => s + (r.metrics.conversions || 0), 0);
    report += `- 📝 发布内容：${weekChannelRecords.filter(r => r.type === 'post').length} 条\n`;
    report += `- 💰 投放次数：${weekChannelRecords.filter(r => r.type === 'ads').length} 次\n`;
    report += `- 🤝 合作次数：${weekChannelRecords.filter(r => r.type === 'cooperation').length} 次\n`;
    report += `- 👁️ 总曝光：${totalViews} 次\n`;
    report += `- 👆 总点击：${totalClicks} 次\n`;
    report += `- ✅ 总转化：${totalConversions} 单\n\n`;
  }

  report += `## 🎙️ 用户访谈\n\n`;
  if (weekInterviews.length === 0) {
    report += `> 本周暂无访谈记录\n\n`;
  } else {
    report += `本周完成 ${weekInterviews.length} 场用户访谈：\n\n`;
    const allQuestions = weekInterviews.flatMap(i => i.questions);
    const questionCount: Record<string, number> = {};
    allQuestions.forEach(q => {
      questionCount[q] = (questionCount[q] || 0) + 1;
    });
    report += `**高频问题：**\n\n`;
    Object.entries(questionCount).slice(0, 5).forEach(([q, count]) => {
      report += `- ❓「${q}」（出现 ${count} 次）\n`;
    });
    report += `\n`;
  }

  report += `## 💡 灵感池新增\n\n`;
  const weekIdeas = data.ideas.filter(i => isThisWeek(i.createdAt));
  if (weekIdeas.length === 0) {
    report += `> 本周暂无新增灵感\n\n`;
  } else {
    weekIdeas.forEach(i => {
      report += `- 💡 ${i.title} ${i.tags.map(t => `#${t}`).join(' ')}\n`;
    });
    report += `\n`;
  }

  report += `---\n\n`;
  report += `> 📅 报告生成时间：${formatDate(new Date(), 'full')}\n`;
  report += `> 🧪 由「副业实验室」自动生成\n`;

  return report;
}

export function downloadReport(markdown: string, filename?: string) {
  const { start } = getWeekRange();
  const defaultName = `副业实验室周报_${formatDate(start).replace(/-/g, '')}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
