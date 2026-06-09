export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  costScore: number;
  cycleScore: number;
  interestScore: number;
  status: 'active' | 'converted' | 'archived';
  createdAt: string;
}

export type ExperimentStatus = 'draft' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type TaskStage = 'preparation' | 'launch' | 'followup';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type ChannelType = 'post' | 'ads' | 'cooperation';
export type OrderType = 'sale' | 'refund' | 'cost';
export type MaterialCategory = 'copywriting' | 'image' | 'quotation' | 'reply';
export type Recommendation = 'continue' | 'pause' | 'abandon';

export interface Metric {
  id: string;
  experimentId: string;
  name: string;
  target: number;
  current: number;
}

export interface Experiment {
  id: string;
  ideaId: string | null;
  title: string;
  status: ExperimentStatus;
  targetAudience: string;
  price: number;
  channels: string[];
  startDate: string;
  endDate: string;
  progress: number;
  description: string;
}

export interface Task {
  id: string;
  experimentId: string | null;
  title: string;
  stage: TaskStage;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  notes?: string;
}

export interface ChannelRecord {
  id: string;
  experimentId: string | null;
  type: ChannelType;
  platform: string;
  content: string;
  date: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    clicks?: number;
    conversions?: number;
    budget?: number;
    feedback?: string;
  };
}

export interface Interview {
  id: string;
  experimentId: string | null;
  interviewee: string;
  contactInfo?: string;
  date: string;
  questions: string[];
  notes: string;
}

export interface Order {
  id: string;
  experimentId: string | null;
  type: OrderType;
  amount: number;
  cost?: number;
  status: string;
  date: string;
  note?: string;
  customerName?: string;
}

export interface Material {
  id: string;
  category: MaterialCategory;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface RiskItem {
  id: string;
  type: 'overdue_task' | 'low_conversion' | 'no_activity' | 'budget_exceed';
  level: 'low' | 'medium' | 'high';
  message: string;
  relatedId?: string;
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
}
