import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, CheckSquare,
  Clock, AlertTriangle, Edit3, Trash2, X
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getMonthCalendar, formatDate, generateId, isToday, isOverdue, toSafeISODate, toDateInputValue, isValidDateInput } from '@/utils/date';
import { Task, TaskStage, TaskPriority } from '@/types';

const stageColors: Record<TaskStage, string> = {
  preparation: 'bg-indigo-500',
  launch: 'bg-amber-500',
  followup: 'bg-emerald-500',
};
const stageLabels: Record<TaskStage, string> = {
  preparation: '准备',
  launch: '发布',
  followup: '跟进',
};
const priorityLabels: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
const priorityColors: Record<TaskPriority, string> = {
  high: 'bg-coral-100 text-coral-700 border-coral-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const tasks = useAppStore((s) => s.tasks);
  const experiments = useAppStore((s) => s.experiments);
  const addTask = useAppStore((s) => s.addTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: '',
    stage: 'preparation' as TaskStage,
    priority: 'medium' as TaskPriority,
    experimentId: '' as string,
    dueDate: '',
    notes: '',
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => getMonthCalendar(year, month), [year, month]);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      const key = new Date(t.dueDate).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const openModal = (date?: Date, task?: Task) => {
    if (task) {
      setEditingTask(task);
      setForm({
        title: task.title,
        stage: task.stage,
        priority: task.priority,
        experimentId: task.experimentId || '',
        dueDate: toDateInputValue(task.dueDate),
        notes: task.notes || '',
      });
    } else {
      setEditingTask(null);
      setForm({
        title: '',
        stage: 'preparation',
        priority: 'medium',
        experimentId: '',
        dueDate: date ? toDateInputValue(date.toISOString()) : toDateInputValue(),
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (!isValidDateInput(form.dueDate)) {
      form.dueDate = toDateInputValue();
    }
    if (editingTask) {
      updateTask(editingTask.id, {
        title: form.title,
        stage: form.stage,
        priority: form.priority,
        experimentId: form.experimentId || null,
        dueDate: toSafeISODate(form.dueDate),
        notes: form.notes,
      });
    } else {
      const task: Omit<Task, 'id'> = {
        title: form.title,
        stage: form.stage,
        priority: form.priority,
        experimentId: form.experimentId || null,
        dueDate: toSafeISODate(form.dueDate),
        status: 'pending',
        notes: form.notes,
      };
      addTask(task);
    }
    setShowModal(false);
  };

  const selectedTasks = selectedDate
    ? tasksByDate[selectedDate.toISOString().split('T')[0]] || []
    : [];

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">📅</span>
            任务日历
          </h1>
          <p className="text-slate-500 mt-1.5">
            规划每一步，拆解副业大目标为可执行的小任务
          </p>
        </div>
        <button onClick={() => openModal()} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 日历主体 */}
        <div className="lg:col-span-3 lab-card p-6">
          {/* 日历头部 */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">
              <CalendarDays className="w-5 h-5 text-lab-indigo-500" />
              {year}年{month + 1}月
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }}
                className="lab-btn-ghost !px-3 !py-1.5 text-xs"
              >
                今天
              </button>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 星期 */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-semibold py-2 ${
                  i >= 5 ? 'text-coral-500' : 'text-slate-500'
                }`}
              >
                周{d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1.5">
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                if (!date) {
                  return <div key={`${wi}-${di}`} className="h-28 bg-slate-50/50 rounded-lg" />;
                }
                const dateKey = date.toISOString().split('T')[0];
                const dayTasks = tasksByDate[dateKey] || [];
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateKey;
                const isToday_ = isToday(dateKey);
                const isWeekend = di >= 5;

                return (
                  <div
                    key={`${wi}-${di}`}
                    onClick={() => setSelectedDate(date)}
                    className={`h-28 rounded-lg border p-1.5 cursor-pointer transition-all overflow-hidden group ${
                      isSelected
                        ? 'ring-2 ring-lab-amber-400 border-lab-amber-400 bg-amber-50/50'
                        : isToday_
                        ? 'border-lab-indigo-400 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-mono font-semibold ${
                          isToday_
                            ? 'w-6 h-6 rounded-full bg-lab-indigo-500 text-white flex items-center justify-center'
                            : isWeekend
                            ? 'text-coral-500'
                            : 'text-slate-700'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(date); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-lab-indigo-600 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); openModal(date, t); }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                            t.status === 'completed'
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : isOverdue(t.dueDate)
                              ? 'bg-coral-50 text-coral-700'
                              : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageColors[t.stage]}`}></span>
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-slate-400 pl-2.5">
                          +{dayTasks.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 flex-wrap">
            {(Object.keys(stageLabels) as TaskStage[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${stageColors[s]}`}></span>
                {stageLabels[s]}阶段
              </div>
            ))}
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 选中日期任务 */}
          <div className="lab-card p-5">
            <h3 className="section-title mb-4">
              <CheckSquare className="w-4 h-4 text-lab-amber-500" />
              {selectedDate
                ? formatDate(selectedDate, 'chinese') + ' 的任务'
                : '今日任务'}
            </h3>
            <div className="space-y-2">
              {selectedTasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center bg-slate-50/50 rounded-lg">
                  当天暂无任务
                </p>
              ) : (
                selectedTasks.map((t) => {
                  const exp = experiments.find((e) => e.id === t.experimentId);
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border transition-all group ${
                        t.status === 'completed'
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : isOverdue(t.dueDate)
                          ? 'bg-coral-50 border-coral-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={t.status === 'completed'}
                          onChange={() => toggleTaskComplete(t.id)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-lab-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </p>
                          {exp && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">🧪 {exp.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <span className={`lab-badge !px-1.5 !py-0 text-[10px] border ${priorityColors[t.priority]}`}>
                          {priorityLabels[t.priority]}优
                        </span>
                        <span className={`lab-badge !px-1.5 !py-0 text-[10px] ${
                          t.stage === 'preparation' ? 'bg-indigo-50 text-indigo-700' :
                          t.stage === 'launch' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {stageLabels[t.stage]}
                        </span>
                        <button
                          onClick={() => openModal(undefined, t)}
                          className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 近期待办 */}
          <div className="lab-card p-5">
            <h3 className="section-title mb-4">
              <Clock className="w-4 h-4 text-indigo-500" />
              近期待办 Top10
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto -mx-2 px-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  🎉 全部任务都完成啦！
                </p>
              ) : (
                upcomingTasks.map((t) => {
                  const overdue = isOverdue(t.dueDate);
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                        overdue ? 'text-coral-600' : ''
                      }`}
                      onClick={() => {
                        const d = new Date(t.dueDate);
                        setViewDate(d);
                        setSelectedDate(d);
                      }}
                    >
                      {overdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse" />}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${stageColors[t.stage]}`}></span>
                      <span className={`text-sm truncate flex-1 ${overdue ? 'font-medium' : ''}`}>
                        {t.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0 font-mono">
                        {new Date(t.dueDate).getMonth() + 1}/{new Date(t.dueDate).getDate()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 新建/编辑任务弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
              <h3 className="font-bold text-lg">
                {editingTask ? '编辑任务' : '新建任务'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="lab-label">任务内容 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="lab-input"
                  placeholder="需要完成的具体任务"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">所属阶段</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value as TaskStage })}
                    className="lab-input"
                  >
                    <option value="preparation">准备阶段</option>
                    <option value="launch">发布阶段</option>
                    <option value="followup">跟进阶段</option>
                  </select>
                </div>
                <div>
                  <label className="lab-label">优先级</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="lab-input"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="lab-label">关联实验</label>
                <select
                  value={form.experimentId}
                  onChange={(e) => setForm({ ...form, experimentId: e.target.value })}
                  className="lab-input"
                >
                  <option value="">不关联</option>
                  {experiments.filter(e => e.status !== 'abandoned').map((e) => (
                    <option key={e.id} value={e.id}>🧪 {e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="lab-label">截止日期</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="lab-input"
                />
              </div>
              <div>
                <label className="lab-label">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="lab-textarea"
                  placeholder="可选：补充说明"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-between bg-slate-50">
              {editingTask && (
                <button
                  onClick={() => { deleteTask(editingTask.id); setShowModal(false); }}
                  className="lab-btn-ghost !text-coral-600"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setShowModal(false)} className="lab-btn-secondary">
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="lab-btn-primary"
                >
                  {editingTask ? '保存修改' : '添加任务'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
