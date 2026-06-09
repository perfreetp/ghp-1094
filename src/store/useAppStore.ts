import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Idea, Experiment, Task, ChannelRecord, Interview, Order, Material, RiskItem, RevenueDataPoint
} from '@/types';
import {
  initialIdeas, initialExperiments, initialTasks, initialChannelRecords,
  initialInterviews, initialOrders, initialMaterials
} from './initialData';
import { generateId, isOverdue, isThisMonth, isToday } from '@/utils/date';
import { calculateIdeaScore, sortIdeasByScore } from '@/utils/scoring';
import { generateWeeklyReport } from '@/utils/report';

interface AppState {
  ideas: Idea[];
  experiments: Experiment[];
  tasks: Task[];
  channelRecords: ChannelRecord[];
  interviews: Interview[];
  orders: Order[];
  materials: Material[];

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

  getTotalRevenue: () => number;
  getMonthlyRevenue: () => number;
  getActiveExperiments: () => Experiment[];
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getRisks: () => RiskItem[];
  getRevenueTrend: (days?: number) => RevenueDataPoint[];
  getExperimentById: (id: string) => Experiment | undefined;
  getTasksByExperiment: (expId: string) => Task[];
  getOrdersByExperiment: (expId: string) => Order[];
  getExperimentProfit: (expId: string) => number;
  exportWeeklyReport: () => string;
  resetAllData: () => void;
}

const STORAGE_KEY = 'side-hustle-lab-store';

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

      addIdea: (idea) =>
        set((state) => ({
          ideas: [
            {
              ...idea,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
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
          experiments: [{ ...exp, id: generateId() }, ...state.experiments],
        })),

      updateExperiment: (id, data) =>
        set((state) => ({
          experiments: state.experiments.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),

      deleteExperiment: (id) =>
        set((state) => ({
          experiments: state.experiments.filter((e) => e.id !== id),
          tasks: state.tasks.map((t) =>
            t.experimentId === id ? { ...t, experimentId: null } : t
          ),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [{ ...task, id: generateId() }, ...state.tasks],
        })),

      updateTask: (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
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
          channelRecords: [{ ...record, id: generateId() }, ...state.channelRecords],
        })),

      updateChannelRecord: (id, data) =>
        set((state) => ({
          channelRecords: state.channelRecords.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        })),

      deleteChannelRecord: (id) =>
        set((state) => ({
          channelRecords: state.channelRecords.filter((r) => r.id !== id),
        })),

      addInterview: (interview) =>
        set((state) => ({
          interviews: [{ ...interview, id: generateId() }, ...state.interviews],
        })),

      updateInterview: (id, data) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),

      deleteInterview: (id) =>
        set((state) => ({
          interviews: state.interviews.filter((i) => i.id !== id),
        })),

      addOrder: (order) =>
        set((state) => ({
          orders: [{ ...order, id: generateId() }, ...state.orders],
        })),

      updateOrder: (id, data) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...data } : o
          ),
        })),

      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),

      addMaterial: (material) =>
        set((state) => ({
          materials: [
            {
              ...material,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
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

      getTotalRevenue: () => {
        const { orders } = get();
        const sales = orders
          .filter((o) => o.type === 'sale')
          .reduce((s, o) => s + o.amount, 0);
        const refunds = orders
          .filter((o) => o.type === 'refund')
          .reduce((s, o) => s + o.amount, 0);
        return sales - refunds;
      },

      getMonthlyRevenue: () => {
        const { orders } = get();
        const sales = orders
          .filter((o) => o.type === 'sale' && isThisMonth(o.date))
          .reduce((s, o) => s + o.amount, 0);
        const refunds = orders
          .filter((o) => o.type === 'refund' && isThisMonth(o.date))
          .reduce((s, o) => s + o.amount, 0);
        return sales - refunds;
      },

      getActiveExperiments: () => {
        return get().experiments.filter((e) => e.status === 'in_progress');
      },

      getTodayTasks: () => {
        return get().tasks.filter(
          (t) => (isToday(t.dueDate) || (isOverdue(t.dueDate) && t.status !== 'completed')) && t.status !== 'completed'
        ).sort((a, b) => {
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
            const expOrders = state.orders.filter(
              (o) => o.experimentId === e.id
            );
            const revenue = expOrders
              .filter((o) => o.type === 'sale')
              .reduce((s, o) => s + o.amount, 0);
            const daysRunning = Math.floor(
              (Date.now() - new Date(e.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysRunning > 14 && revenue === 0) {
              risks.push({
                id: `risk-exp-${e.id}`,
                type: 'low_conversion',
                level: 'high',
                message: `实验「${e.title}」已运行${daysRunning}天仍无收入`,
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

      getExperimentById: (id) => get().experiments.find((e) => e.id === id),

      getTasksByExperiment: (expId) =>
        get().tasks.filter((t) => t.experimentId === expId),

      getOrdersByExperiment: (expId) =>
        get().orders.filter((o) => o.experimentId === expId),

      getExperimentProfit: (expId) => {
        const expOrders = get().getOrdersByExperiment(expId);
        const sales = expOrders
          .filter((o) => o.type === 'sale')
          .reduce((s, o) => s + o.amount, 0);
        const refunds = expOrders
          .filter((o) => o.type === 'refund')
          .reduce((s, o) => s + o.amount, 0);
        const costs = expOrders
          .filter((o) => o.type === 'cost')
          .reduce((s, o) => s + (o.cost || o.amount), 0);
        return sales - refunds - costs;
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
        })),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
