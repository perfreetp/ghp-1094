import { useState, useMemo } from 'react';
import {
  Plus, Receipt, DollarSign, TrendingUp, ArrowDownUp,
  Filter, X, Trash2, Wallet, ArrowUpRight, ArrowDownRight, Calculator
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Order, OrderType } from '@/types';
import { formatDate, toSafeISODate, toDateInputValue, isValidDateInput } from '@/utils/date';

const typeConfig: Record<OrderType, { label: string; icon: any; color: string; bg: string; sign: string }> = {
  sale: { label: '销售收入', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', sign: '+' },
  refund: { label: '退款', icon: ArrowDownRight, color: 'text-coral-700', bg: 'bg-coral-50 border-coral-200', sign: '-' },
  cost: { label: '成本支出', icon: ArrowDownUp, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', sign: '-' },
};

export default function Orders() {
  const orders = useAppStore((s) => s.orders);
  const experiments = useAppStore((s) => s.experiments);
  const addOrder = useAppStore((s) => s.addOrder);
  const deleteOrder = useAppStore((s) => s.deleteOrder);
  const getFinance = useAppStore((s) => s.getFinance);
  const getExperimentFinance = useAppStore((s) => s.getExperimentFinance);

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<OrderType | 'all'>('all');
  const [filterExp, setFilterExp] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'sale' as OrderType,
    amount: '',
    cost: '',
    experimentId: '' as string,
    date: toDateInputValue(),
    status: '',
    note: '',
    customerName: '',
  });

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== 'all') list = list.filter(o => o.type === filter);
    if (filterExp) list = list.filter(o => o.experimentId === filterExp);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, filter, filterExp]);

  const stats = getFinance();

  const expStats = useMemo(() => {
    const expIds = new Set<string | null>([null, ...experiments.map(e => e.id)]);
    orders.forEach(o => expIds.add(o.experimentId));
    return Array.from(expIds)
      .map((expId) => {
        const fin = getExperimentFinance(expId);
        const exp = experiments.find(e => e.id === expId);
        return {
          exp,
          revenue: fin.revenue,
          cost: fin.costs,
          profit: fin.profit,
          count: fin.orderCount,
        };
      })
      .filter(item => item.revenue !== 0 || item.cost !== 0 || item.count !== 0)
      .sort((a, b) => b.profit - a.profit);
  }, [orders, experiments, getExperimentFinance]);

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    const defaultStatus = form.type === 'sale' ? '已完成' : form.type === 'refund' ? '已退款' : '已支出';
    addOrder({
      type: form.type,
      amount: Number(form.amount),
      cost: form.cost ? Number(form.cost) : undefined,
      experimentId: form.experimentId || null,
      date: toSafeISODate(form.date),
      status: form.status || defaultStatus,
      note: form.note || undefined,
      customerName: form.customerName || undefined,
    });
    setShowModal(false);
    setForm({
      type: 'sale',
      amount: '',
      cost: '',
      experimentId: '',
      date: toDateInputValue(),
      status: '',
      note: '',
      customerName: '',
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            <span className="text-3xl">💰</span>
            订单账本
          </h1>
          <p className="text-slate-500 mt-1.5">
            每一笔收支都算数，清清楚楚算副业账
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="lab-btn-primary">
          <Plus className="w-4 h-4" />
          记一笔
        </button>
      </div>

      {/* 核心财务指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="lab-card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">净收入</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">¥{stats.revenue.toFixed(2)}</div>
        </div>
        <div className={`lab-card p-5 border-2 ${
          stats.profit >= 0
            ? 'bg-gradient-to-br from-teal-50 to-white border-teal-100'
            : 'bg-gradient-to-br from-coral-50 to-white border-coral-100'
        }`}>
          <div className={`flex items-center gap-2 mb-2 ${stats.profit >= 0 ? 'text-teal-700' : 'text-coral-700'}`}>
            <Calculator className="w-4 h-4" />
            <span className="text-xs font-medium">净利润</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${stats.profit >= 0 ? 'text-teal-700' : 'text-coral-700'}`}>
            ¥{stats.profit.toFixed(2)}
          </div>
        </div>
        <div className="lab-card p-5 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">成本投入</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">¥{stats.costs.toFixed(2)}</div>
        </div>
        <div className="lab-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-700">成交订单</span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700">{stats.orderCount}</div>
        </div>
        <div className="lab-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-violet-700">客单价</span>
          </div>
          <div className="text-2xl font-bold font-mono text-violet-700">¥{stats.avgOrderValue.toFixed(0)}</div>
        </div>
        <div className="lab-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-medium text-rose-700">退款率</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${
            stats.refundRate > 10 ? 'text-coral-600' : 'text-emerald-600'
          }`}>
            {stats.refundRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 流水列表 */}
        <div className="lg:col-span-2 lab-card p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="section-title">
              <Receipt className="w-5 h-5 text-lab-indigo-500" />
              交易流水
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterExp || ''}
                onChange={e => setFilterExp(e.target.value || null)}
                className="lab-input !w-auto !py-1 !text-xs"
              >
                <option value="">全部实验</option>
                {experiments.map(e => <option key={e.id} value={e.id}>🧪 {e.title}</option>)}
              </select>
              {(['all', 'sale', 'refund', 'cost'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`lab-badge cursor-pointer transition-all ${
                    filter === t
                      ? '!bg-lab-indigo-500 !text-white scale-105'
                      : t === 'all' ? 'bg-slate-100 text-slate-600' : typeConfig[t].bg + ' ' + typeConfig[t].color
                  }`}
                >
                  {t === 'all' ? '全部' : typeConfig[t].label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <p>暂无交易记录</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-left text-slate-600 text-xs">
                      <th className="px-4 py-3 font-medium">日期</th>
                      <th className="px-4 py-3 font-medium">类型</th>
                      <th className="px-4 py-3 font-medium">金额</th>
                      <th className="px-4 py-3 font-medium">关联实验</th>
                      <th className="px-4 py-3 font-medium">客户/备注</th>
                      <th className="px-4 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(o => {
                      const cfg = typeConfig[o.type];
                      const Icon = cfg.icon;
                      const exp = experiments.find(e => e.id === o.experimentId);
                      const isPositive = o.type === 'sale';
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {formatDate(o.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`lab-badge border ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold text-lg ${cfg.color}`}>
                              {cfg.sign}¥{o.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {exp ? (
                              <span className="lab-badge bg-indigo-50 text-indigo-700 border border-indigo-100">
                                🧪 {exp.title}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <div className="text-slate-700 text-xs">
                              {o.customerName && (
                                <div className="font-medium text-slate-800">👤 {o.customerName}</div>
                              )}
                              {o.note && <div className="text-slate-500 truncate">📝 {o.note}</div>}
                              {!o.customerName && !o.note && <span className="text-slate-400">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteOrder(o.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-coral-600 hover:bg-coral-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 各实验盈亏 */}
        <div className="lab-card p-6">
          <h3 className="section-title mb-5">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            实验盈亏榜
          </h3>
          {expStats.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Calculator className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p className="text-sm">暂无数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expStats.map((item, idx) => {
                const max = Math.max(...expStats.map(s => Math.abs(s.profit))) || 1;
                const width = Math.abs(item.profit) / max * 100;
                return (
                  <div key={item.exp?.id || 'others'} className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                          idx === 0 ? 'bg-lab-amber-400 text-white' :
                          idx === 1 ? 'bg-slate-300 text-white' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                          {item.exp ? item.exp.title : '未分类'}
                        </span>
                      </div>
                      <span className={`font-mono font-bold text-sm ${
                        item.profit >= 0 ? 'text-emerald-600' : 'text-coral-600'
                      }`}>
                        ¥{item.profit.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.profit >= 0
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : 'bg-gradient-to-r from-coral-400 to-coral-500'
                        }`}
                        style={{ width: `${Math.max(width, 3)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>收入 ¥{item.revenue.toFixed(0)} · {item.count}单</span>
                      <span>成本 ¥{item.cost.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 记账弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-lab-indigo-500 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                记一笔
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="lab-label">类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sale', 'refund', 'cost'] as OrderType[]).map(t => {
                    const cfg = typeConfig[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, type: t })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          form.type === t
                            ? cfg.bg + ' ring-2 ring-lab-indigo-400 border-transparent'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">金额 *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="lab-input pl-7 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="lab-label">{form.type === 'cost' ? '实际成本' : '附加成本(可选)'}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={e => setForm({ ...form, cost: e.target.value })}
                      className="lab-input pl-7 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="lab-label">关联实验</label>
                <select
                  value={form.experimentId}
                  onChange={e => setForm({ ...form, experimentId: e.target.value })}
                  className="lab-input"
                >
                  <option value="">不关联</option>
                  {experiments.map(e => <option key={e.id} value={e.id}>🧪 {e.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lab-label">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="lab-input"
                  />
                </div>
                <div>
                  <label className="lab-label">客户姓名(可选)</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="lab-input"
                    placeholder="客户昵称"
                  />
                </div>
              </div>
              <div>
                <label className="lab-label">备注(可选)</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  className="lab-textarea"
                  placeholder="订单详情/退款原因等..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
              <button onClick={() => setShowModal(false)} className="lab-btn-secondary">取消</button>
              <button onClick={handleSubmit} disabled={!form.amount} className="lab-btn-primary">
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
