import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Idea, Experiment, Task, ChannelRecord, Interview, Order, Material,
  RiskItem, RevenueDataPoint, Metric,
} from '@/types';
import {
  initialIdeas, initialExperiments, initialTasks, initialChannelRecords,
  initialInterviews, initialOrders, initialMaterials, initialMetrics,
} from './initialData';
import { generateId, isOverdue, isThisMonth, isToday } from '@/utils/date';
import { calculateIdeaScore, sortIdeasByScore } from '@/utils/scoring';
import { generateWeeklyReport } from '@/utils/report';
import {
  calculateBreakdown, calculateExperimentFinance, computeMetricStatus,
  getFullRecommendation, FinanceBreakdown, FullAnalysis,
} from '@/utils/finance';

const safeDate = (d?: string | null, fallback = new Date().toISOString()) => {
  if (!d) return fallback;
  try { const parsed = new Date(d); if (isNaN(parsed.getTime())) return fallback; return d; }
  catch { return fallback; }
};

interface AppState {
  ideas: Idea[];
  experiments: Experiment[];
  tasks: Task[];
  channelRecords: ChannelRecord[];
  interviews: Interview[];
  orders: Order[];
  materials: Material[];
  metrics: Metric[];

  addIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => void;
  updateIdea: (id: string, data: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  convertIdeaToExperiment: (ideaId: string) => string;

  addExperiment: (exp: Omit<Experiment, 'id'>) => void;
  updateExperiment: (id: string, data: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;

  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;

  addChannelRecord: (record: Omit<ChannelRecord, 'id'>) => void;
  updateChannelRecord: (id: string, data: Partial<ChannelRecord>) => void;
  deleteChannelRecord: (id: string) => void;

  addInterview: (interview: Omit<Interview, 'id'>) => void;
  updateInterview: (id: string, data: Partial<Interview>) => void;
  deleteInterview: (id: string) => void;

  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;

  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => void;
  updateMaterial: (id: string, data: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addMetric: (metric: Omit<Metric, 'id'>) => void;
  updateMetric: (id: string, data: Partial<Metric>) => void;
  deleteMetric: (id: string) => void;

  getFinance: (scope?: 'all' | 'month' | 'week') => FinanceBreakdown;
  getExperimentFinance: (expId: string | null) => FinanceBreakdown;
  getTotalRevenue: () => number;
  getMonthlyRevenue: () => number;
  getMonthlyProfit: () => number;
  getActiveExperiments: () => Experiment[];
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getRisks: () => RiskItem[];
  getRevenueTrend: (days?: number) => RevenueDataPoint[];
  getExperimentById: (id: string) => Experiment | undefined;
  getTasksByExperiment: (expId: string) => Task[];
  getOrdersByExperiment: (expId: string) => Order[];
  getMetricsByExperiment: (expId: string) => Metric[];
  getChannelsByExperiment: (expId: string) => ChannelRecord[];
  getInterviewsByExperiment: (expId: string) => Interview[];
  getExperimentProfit: (expId: string) => number;
  getExperimentAnalysis: (expId: string) => FullAnalysis | null;
  exportWeeklyReport: () => string;
  resetAllData: () => void;
}

const STORAGE_KEY = 'side-hustle-lab-store-v2';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ideas: initialIdeas,
      experiments: initialExperiments,
      tasks: initialTasks,
      channelRecords: initialChannelRecords,
      interviews: initialInterviews,
      orders: initialOrders,
      materials: initialMaterials,
      metrics: initialMetrics,

      addIdea: (idea) =>
        set((state) => ({
          ideas: [
            { ...idea, id: generateId(), createdAt: new Date().toISOString() },
            ...state.ideas,
          ],
        })),

      updateIdea: (id, data) =>
        set((state) => ({
          ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      deleteIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.filter((i) => i.id !== id),
        })),

      convertIdeaToExperiment: (ideaId) => {
        const idea = get().ideas.find((i) => i.id === ideaId);
        if (!idea) return '';
        const expId = generateId();
        const newExp: Experiment = {
          id: expId,
          ideaId: idea.id,
          title: idea.title,
          status: 'draft',
          targetAudience: '',
          price: 0,
          channels: [],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          progress: 0,
          description: idea.description,
        };
        set((state) => ({
          experiments: [newExp, ...state.experiments],
          ideas: state.ideas.map((i) =>
            i.id === ideaId ? { ...i, status: 'converted' } : i
          ),
        }));
        return expId;
      },

      addExperiment: (exp) =>
        set((state) => ({
          experiments: [
            { ...exp, id: generateId(), startDate: safeDate(exp.startDate), endDate: safeDate(exp.endDate) },
            ...state.experiments,
          ],
        })),

      updateExperiment: (id, data) =>
        set((state) => ({
          experiments: state.experiments.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...data,
                  startDate: data.startDate !== undefined ? safeDate(data.startDate, e.startDate) : e.startDate,
                  endDate: data.endDate !== undefined ? safeDate(data.endDate, e.endDate) : e.endDate,
                }
              : e
          ),
        })),

      deleteExperiment: (id) =>
        set((state) => ({
          experiments: state.experiments.filter((e) => e.id !== id),
          tasks: state.tasks.map((t) =>
            t.experimentId === id ? { ...t, experimentId: null } : t
          ),
          metrics: state.metrics.filter((m) => m.experimentId !== id),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            { ...task, id: generateId(), dueDate: safeDate(task.dueDate) },
            ...state.tasks,
          ],
        })),

      updateTask: (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...data,
                  dueDate: data.dueDate !== undefined ? safeDate(data.dueDate, t.dueDate) : t.dueDate,
                }
              : t
          ),
        })),

      toggleTaskComplete: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: t.status === 'completed' ? 'pending' : 'completed',
                }
              : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addChannelRecord: (record) =>
        set((state) => ({
          channelRecords: [
            { ...record, id: generateId(), date: safeDate(record.date) },
            ...state.channelRecords,
          ],
        })),

      updateChannelRecord: (id, data) =>
        set((state) => ({
          channelRecords: state.channelRecords.map((r) =>
            r.id === id
              ? { ...r, ...data, date: data.date !== undefined ? safeDate(data.date, r.date) : r.date }
              : r
          ),
        })),

      deleteChannelRecord: (id) =>
        set((state) => ({
          channelRecords: state.channelRecords.filter((r) => r.id !== id),
        })),

      addInterview: (interview) =>
        set((state) => ({
          interviews: [
            { ...interview, id: generateId(), date: safeDate(interview.date) },
            ...state.interviews,
          ],
        })),

      updateInterview: (id, data) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id
              ? { ...i, ...data, date: data.date !== undefined ? safeDate(data.date, i.date) : i.date }
              : i
          ),
        })),

      deleteInterview: (id) =>
        set((state) => ({
          interviews: state.interviews.filter((i) => i.id !== id),
        })),

      addOrder: (order) =>
        set((state) => ({
          orders: [
            { ...order, id: generateId(), date: safeDate(order.date) },
            ...state.orders,
          ],
        })),

      updateOrder: (id, data) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, ...data, date: data.date !== undefined ? safeDate(data.date, o.date) : o.date }
              : o
          ),
        })),

      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),

      addMaterial: (material) =>
        set((state) => ({
          materials: [
            { ...material, id: generateId(), createdAt: new Date().toISOString() },
            ...state.materials,
          ],
        })),

      updateMaterial: (id, data) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),

      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      addMetric: (metric) =>
        set((state) => ({
          metrics: [
            {
              ...metric,
              id: generateId(),
              deadline: metric.deadline ? safeDate(metric.deadline) : undefined,
            },
            ...state.metrics,
          ],
        })),

      updateMetric: (id, data) =>
        set((state) => ({
          metrics: state.metrics.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...data,
                  deadline:
                    data.deadline === undefined
                      ? m.deadline
                      : data.deadline
                      ? safeDate(data.deadline)
                      : undefined,
                }
              : m
          ),
        })),

      deleteMetric: (id) =>
        set((state) => ({
          metrics: state.metrics.filter((m) => m.id !== id),
        })),

      getFinance: (scope = 'all') => calculateBreakdown(get().orders, scope),
      getExperimentFinance: (expId) =>
        calculateExperimentFinance(expId, get().orders),

      getTotalRevenue: () => get().getFinance('all').revenue,
      getMonthlyRevenue: () => get().getFinance('month').revenue,
      getMonthlyProfit: () => get().getFinance('month').profit,

      getActiveExperiments: () =>
        get().experiments.filter((e) => e.status === 'in_progress'),

      getTodayTasks: () => {
        return get()
          .tasks.filter(
            (t) =>
              (isToday(t.dueDate) ||
                (isOverdue(t.dueDate) && t.status !== 'completed')) &&
              t.status !== 'completed'
          )
          .sort((a, b) => {
            const priorityWeight = { high: 0, medium: 1, low: 2 };
            return priorityWeight[a.priority] - priorityWeight[b.priority];
          });
      },

      getOverdueTasks: () => {
        return get().tasks.filter(
          (t) => isOverdue(t.dueDate) && t.status !== 'completed'
        );
      },

      getRisks: (): RiskItem[] => {
        const risks: RiskItem[] = [];
        const state = get();

        const overdueTasks = state.getOverdueTasks();
        if (overdueTasks.length > 0) {
          overdueTasks.forEach((t) => {
            risks.push({
              id: `risk-task-${t.id}`,
              type: 'overdue_task',
              level: t.priority === 'high' ? 'high' : 'medium',
              message: `任务「${t.title}」已超期`,
              relatedId: t.id,
            });
          });
        }

        state.experiments
          .filter((e) => e.status === 'in_progress')
          .forEach((e) => {
            const fin = state.getExperimentFinance(e.id);
            const daysRunning = Math.floor(
              (Date.now() - new Date(e.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysRunning > 14 && fin.sales === 0) {
              risks.push({
                id: `risk-exp-${e.id}`,
                type: 'low_conversion',
                level: 'high',
                message: `实验「${e.title}」已运行${daysRunning}天仍无收入`,
                relatedId: e.id,
              });
            }
            const expMetrics = state.metrics.filter((m) => m.experimentId === e.id);
            expMetrics.forEach((m) => {
              const st = computeMetricStatus(m);
              if (st === 'failed' || st === 'at_risk') {
                risks.push({
                  id: `risk-metric-${m.id}`,
                  type: 'low_conversion',
                  level: st === 'failed' ? 'high' : 'medium',
                  message: `指标「${m.name}」${st === 'failed' ? '已失败' : '有风险'}`,
                  relatedId: e.id,
                });
              }
            });
            if (fin.costs > 0 && fin.costs > fin.sales * 2) {
              risks.push({
                id: `risk-budget-${e.id}`,
                type: 'budget_exceed',
                level: 'high',
                message: `实验「${e.title}」成本已超过销售收入的 2 倍`,
                relatedId: e.id,
              });
            }
          });

        return risks.sort((a, b) => {
          const levelWeight = { high: 0, medium: 1, low: 2 };
          return levelWeight[a.level] - levelWeight[b.level];
        });
      },

      getRevenueTrend: (days = 30) => {
        const { orders } = get();
        const result: RevenueDataPoint[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 86400000);
          const dateStr = date.toISOString().split('T')[0];
          const daySales = orders
            .filter(
              (o) =>
                o.type === 'sale' &&
                new Date(o.date).toISOString().split('T')[0] === dateStr
            )
            .reduce((s, o) => s + o.amount, 0);
          const dayRefunds = orders
            .filter(
              (o) =>
                o.type === 'refund' &&
                new Date(o.date).toISOString().split('T')[0] === dateStr
            )
            .reduce((s, o) => s + o.amount, 0);
          result.push({
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            amount: daySales - dayRefunds,
          });
        }
        return result;
      },

      getExperimentById: (id) =>
        get().experiments.find((e) => e.id === id),

      getTasksByExperiment: (expId) =>
        get().tasks.filter((t) => t.experimentId === expId),

      getOrdersByExperiment: (expId) =>
        get().orders.filter((o) => o.experimentId === expId),

      getMetricsByExperiment: (expId) =>
        get().metrics.filter((m) => m.experimentId === expId),

      getChannelsByExperiment: (expId) =>
        get().channelRecords.filter((c) => c.experimentId === expId),

      getInterviewsByExperiment: (expId) =>
        get().interviews.filter((i) => i.experimentId === expId),

      getExperimentProfit: (expId) =>
        get().getExperimentFinance(expId).profit,

      getExperimentAnalysis: (expId) => {
        const state = get();
        const exp = state.getExperimentById(expId);
        if (!exp) return null;
        return getFullRecommendation({
          experiment: exp,
          orders: state.getOrdersByExperiment(expId),
          tasks: state.getTasksByExperiment(expId),
          metrics: state.getMetricsByExperiment(expId),
          channels: state.getChannelsByExperiment(expId),
          interviews: state.getInterviewsByExperiment(expId),
        });
      },

      exportWeeklyReport: () => {
        const state = get();
        return generateWeeklyReport({
          ideas: state.ideas,
          experiments: state.experiments,
          tasks: state.tasks,
          channelRecords: state.channelRecords,
          interviews: state.interviews,
          orders: state.orders,
          materials: state.materials,
          metrics: state.metrics,
        });
      },

      resetAllData: () =>
        set(() => ({
          ideas: initialIdeas,
          experiments: initialExperiments,
          tasks: initialTasks,
          channelRecords: initialChannelRecords,
          interviews: initialInterviews,
          orders: initialOrders,
          materials: initialMaterials,
          metrics: initialMetrics,
        })),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
