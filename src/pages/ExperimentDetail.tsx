import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Save, X, Target, Users, DollarSign,
  Share2, BarChart2, CheckSquare, CalendarDays, Plus, Trash2,
  Play, Pause, CheckCircle2, FileX, Loader
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/date';
import { ExperimentStatus, TaskStage, TaskPriority, Task } from '@/types';

const statusOptions: { key: ExperimentStatus; label: string; color: string }[] = [
  { key: 'draft', label: '草稿', color: 'bg-slate-100 text-slate-600' },
  { key: 'in_progress', label: '进行中', color: 'bg-amber-100 text-amber-700' },
  { key: 'paused', label: '已暂停', color: 'bg-slate-200 text-slate-600' },
  { key: 'completed', label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'abandoned', label: '已放弃', color: 'bg-coral-100 text-coral-700' },
];

const stageLabels: Record<TaskStage, string> = {
  preparation: '准备阶段',
  launch: '发布阶段',
  followup: '跟进阶段',
};

const stageColors: Record<TaskStage, string> = {
  preparation: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  launch: 'bg-amber-50 border-amber-200 text-amber-700',
  followup: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const priorityStyles: Record<TaskPriority, string> = {
  high: 'bg-coral-100 text-coral-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getExperimentById = useAppStore((s) => s.getExperimentById);
  const updateExperiment = useAppStore((s) => s.updateExperiment);
  const getTasksByExperiment = useAppStore((s) => s.getTasksByExperiment);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const getOrdersByExperiment = useAppStore((s) => s.getOrdersByExperiment);
  const getExperimentProfit = useAppStore((s) => s.getExperimentProfit);

  const experiment = getExperimentById(id!);
  const tasks = id ? getTasksByExperiment(id) : [];
  const orders = id ? getOrdersByExperiment(id) : [];
  const profit = id ? getExperimentProfit(id) : 0;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(experiment || {} as any);
  const [newTask, setNewTask] = useState({ title: '', stage: 'preparation' as TaskStage, priority: 'medium' as TaskPriority, dueDate: '' });

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader className="w-10 h-10 text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500">实验不存在或已被删除</p>
        <button onClick={() => navigate('/experiments')} className="lab-btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回实验列表
        </button>
      </div>
    );
  }

  const handleSave = () => {
    updateExperiment(experiment.id, form);
    setEditing(false);
  };

  const handleStatusChange = (status: ExperimentStatus) => {
    updateExperiment(experiment.id, { status });
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const task: Omit<Task, 'id'> = {
      experimentId: experiment.id,
      title: newTask.title,
      stage: newTask.stage,
      priority: newTask.priority,
      status: 'pending',
      dueDate: newTask.dueDate || new Date().toISOString(),
    };
    addTask(task);
    setNewTask({ title: '', stage: 'preparation', priority: 'medium', dueDate: '' });
  };

  const revenue = orders.filter(o => o.type === 'sale').reduce((s, o) => s + o.amount, 0);
  const salesCount = orders.filter(o => o.type === 'sale').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const currentStatus = statusOptions.find(s => s.key === experiment.status)!;

  const groupedTasks: Record<TaskStage, Task[]> = {
    preparation: tasks.filter(t => t.stage === 'preparation'),
    launch: tasks.filter(t => t.stage === 'launch'),
    followup: tasks.filter(t => t.stage === 'followup'),
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/experiments')}
          className="lab-btn-ghost !px-3"
        >
          <ArrowLeft className="w-4 h-4" />
          返回实验列表
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(experiment); }} className="lab-btn-secondary">
                <X className="w-4 h-4" />
                取消
              </button>
              <button onClick={handleSave} className="lab-btn-primary">
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </>
          ) : (
            <button onClick={() => { setEditing(true); setForm(experiment); }} className="lab-btn-secondary">
              <Edit3 className="w-4 h-4" />
              编辑实验
            </button>
          )}
        </div>
      </div>

      {/* 实验信息卡 */}
      <div className="lab-card p-6 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          experiment.status === 'in_progress' ? 'bg-gradient-to-r from-lab-amber-400 via-lab-amber-500 to-lab-amber-400' :
          experiment.status === 'completed' ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400' :
          experiment.status === 'abandoned' ? 'bg-gradient-to-r from-coral-400 via-coral-500 to-coral-400' :
          'bg-slate-300'
        }`}></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：基本信息 */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                {editing ? (
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="lab-input text-2xl font-bold !py-2 !text-lg"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-slate-900">{experiment.title}</h1>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`lab-badge ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(experiment.startDate)} ~ {formatDate(experiment.endDate)}
                  </span>
                </div>
              </div>

              {/* 状态切换 */}
              <div className="flex flex-wrap gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleStatusChange(opt.key)}
                    className={`lab-badge cursor-pointer transition-all ${
                      experiment.status === opt.key
                        ? 'ring-2 ring-offset-1 ring-lab-indigo-500 scale-105'
                        : 'opacity-60 hover:opacity-100'
                    } ${opt.color}`}
                    title={opt.label}
                  >
                    {opt.key === 'in_progress' && <Play className="w-3 h-3" />}
                    {opt.key === 'paused' && <Pause className="w-3 h-3" />}
                    {opt.key === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {opt.key === 'abandoned' && <FileX className="w-3 h-3" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1.5">
                <Target className="w-3 h-3" /> 实验描述
              </label>
              {editing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="lab-textarea"
                  placeholder="这个实验的目标是什么？打算怎么做？"
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {experiment.description || '暂无描述，点击编辑补充'}
                </p>
              )}
            </div>

            {/* 详细字段 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="lab-label flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" /> 目标人群
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="lab-input"
                    placeholder="例如：0-3年职场新人"
                  />
                ) : (
                  <div className="text-sm text-slate-700 p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    {experiment.targetAudience || '未设置'}
                  </div>
                )}
              </div>
              <div>
                <label className="lab-label flex items-center gap-1 text-xs">
                  <DollarSign className="w-3 h-3" /> 售价策略
                </label>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">¥</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="lab-input"
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-bold font-mono text-emerald-600 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    ¥{experiment.price.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="lab-label flex items-center gap-1 text-xs">
                  <Share2 className="w-3 h-3" /> 渠道
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={(form.channels || []).join(', ')}
                    onChange={(e) => setForm({
                      ...form,
                      channels: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
                    })}
                    className="lab-input"
                    placeholder="用逗号分隔，例如：小红书, 知乎, 朋友圈"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {experiment.channels.length === 0 ? (
                      <span className="text-sm text-slate-400">未设置渠道</span>
                    ) : experiment.channels.map((c) => (
                      <span
                        key={c}
                        className="lab-badge bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="lab-label flex items-center gap-1 text-xs">
                  <CalendarDays className="w-3 h-3" /> 开始日期
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={form.startDate?.split('T')[0]}
                    onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })}
                    className="lab-input"
                  />
                ) : (
                  <div className="text-sm text-slate-700 p-2.5 bg-slate-50 rounded-lg">{formatDate(experiment.startDate)}</div>
                )}
              </div>
              <div>
                <label className="lab-label flex items-center gap-1 text-xs">
                  <BarChart2 className="w-3 h-3" /> 完成进度 ({experiment.progress}%)
                </label>
                {editing ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.progress}
                      onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                      className="flex-1 accent-lab-amber-500"
                    />
                    <span className="font-mono font-bold text-sm text-slate-700 w-12 text-right">{form.progress}%</span>
                  </div>
                ) : (
                  <div className="h-8 flex items-center">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-lab-amber-400 to-lab-amber-500 rounded-full"
                        style={{ width: `${experiment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：数据统计 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                <div className="text-xs text-emerald-600 font-medium mb-1">总收入</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">¥{revenue.toFixed(0)}</div>
              </div>
              <div className={`p-4 rounded-xl border ${
                profit >= 0
                  ? 'bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200'
                  : 'bg-gradient-to-br from-coral-50 to-coral-100/50 border-coral-200'
              }`}>
                <div className={`text-xs font-medium mb-1 ${profit >= 0 ? 'text-teal-600' : 'text-coral-600'}`}>净利润</div>
                <div className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-teal-700' : 'text-coral-700'}`}>¥{profit.toFixed(0)}</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                <div className="text-xs text-amber-600 font-medium mb-1">成交订单</div>
                <div className="text-2xl font-bold text-amber-700 font-mono">{salesCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200">
                <div className="text-xs text-indigo-600 font-medium mb-1">任务完成</div>
                <div className="text-2xl font-bold text-indigo-700 font-mono">{completedTasks}/{tasks.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 任务管理 */}
      <div className="lab-card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="section-title">
            <CheckSquare className="w-5 h-5 text-lab-indigo-500" />
            实验任务 ({tasks.length})
          </h2>
        </div>

        {/* 添加任务表单 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              type="text"
              placeholder="输入任务内容..."
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="lab-input md:col-span-5"
            />
            <select
              value={newTask.stage}
              onChange={(e) => setNewTask({ ...newTask, stage: e.target.value as TaskStage })}
              className="lab-input md:col-span-2"
            >
              <option value="preparation">准备阶段</option>
              <option value="launch">发布阶段</option>
              <option value="followup">跟进阶段</option>
            </select>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
              className="lab-input md:col-span-2"
            >
              <option value="low">低优先级</option>
              <option value="medium">中优先级</option>
              <option value="high">高优先级</option>
            </select>
            <input
              type="date"
              value={newTask.dueDate.split('T')[0]}
              onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value).toISOString() })}
              className="lab-input md:col-span-2"
            />
            <button
              onClick={handleAddTask}
              disabled={!newTask.title.trim()}
              className="lab-btn-primary md:col-span-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </div>

        {/* 任务分组展示 */}
        <div className="space-y-6">
          {(Object.keys(groupedTasks) as TaskStage[]).map((stage) => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`lab-badge border ${stageColors[stage]}`}>
                  {stageLabels[stage]}
                </span>
                <span className="text-xs text-slate-400">
                  {groupedTasks[stage].filter(t => t.status === 'completed').length}/{groupedTasks[stage].length} 完成
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {groupedTasks[stage].length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center bg-slate-50/50 rounded-lg">
                  暂无任务
                </p>
              ) : (
                <div className="space-y-2">
                  {groupedTasks[stage].map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all group ${
                        task.status === 'completed'
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-white border-slate-200 hover:border-lab-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => toggleTaskComplete(task.id)}
                        className="w-4 h-4 rounded border-slate-300 text-lab-indigo-500 focus:ring-lab-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`lab-badge !px-1.5 !py-0 text-[10px] ${priorityStyles[task.priority]}`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                          <span className="text-xs text-slate-400">
                            截止 {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-coral-600 hover:bg-coral-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
