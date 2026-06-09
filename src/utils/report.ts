import {
  Idea, Experiment, Task, ChannelRecord, Interview, Order, Material
} from '@/types';
import { formatDate, getWeekRange, isThisWeek } from './date';

interface ReportData {
  ideas: Idea[];
  experiments: Experiment[];
  tasks: Task[];
  channelRecords: ChannelRecord[];
  interviews: Interview[];
  orders: Order[];
  materials: Material[];
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
  const revenue = weekOrders
    .filter(o => o.type === 'sale')
    .reduce((sum, o) => sum + o.amount, 0);
  const refunds = weekOrders
    .filter(o => o.type === 'refund')
    .reduce((sum, o) => sum + o.amount, 0);
  const costs = weekOrders
    .filter(o => o.type === 'cost')
    .reduce((sum, o) => sum + (o.cost || o.amount), 0);
  const profit = revenue - refunds - costs;

  const weekChannelRecords = data.channelRecords.filter(r => isThisWeek(r.date));
  const weekInterviews = data.interviews.filter(i => isThisWeek(i.date));

  const topExperiments = data.experiments
    .filter(e => e.status === 'in_progress')
    .map(exp => {
      const expRevenue = data.orders
        .filter(o => o.experimentId === exp.id && o.type === 'sale' && isThisWeek(o.date))
        .reduce((s, o) => s + o.amount, 0);
      return { ...exp, revenue: expRevenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  let report = `# 📊 副业实验室 · 周工作报告\n\n`;
  report += `**报告周期**：${weekLabel}\n\n`;
  report += `---\n\n`;

  report += `## 💰 本周财务概览\n\n`;
  report += `| 指标 | 金额 |\n|------|------|\n| 💰 总收入 | ¥${revenue.toFixed(2)} |\n| 💸 退款 | ¥${refunds.toFixed(2)} |\n| 📦 成本支出 | ¥${costs.toFixed(2)} |\n| 📈 净利润 | **¥${profit.toFixed(2)}** |\n| 🧾 成交订单数 | ${weekOrders.filter(o => o.type === 'sale').length} 单 |\n\n`;

  report += `## 🧪 进行中实验\n\n`;
  if (topExperiments.length === 0) {
    report += `> 暂无进行中的实验\n\n`;
  } else {
    report += `| 实验名称 | 进度 | 本周收入 | 状态 |\n|----------|------|----------|------|\n`;
    topExperiments.forEach(e => {
      report += `| ${e.title} | ${e.progress}% | ¥${e.revenue.toFixed(2)} | ${e.status === 'in_progress' ? '进行中' : e.status} |\n`;
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
