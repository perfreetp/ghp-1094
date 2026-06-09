import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Lightbulb, FlaskConical, Calendar,
  Megaphone, MessageSquare, Receipt, BarChart3, FolderKanban,
  FileDown, Beaker, Bell
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { downloadReport } from '@/utils/report';

const navItems = [
  { path: '/', label: '主控台', icon: LayoutDashboard, emoji: '📊' },
  { path: '/ideas', label: '灵感池', icon: Lightbulb, emoji: '💡' },
  { path: '/experiments', label: '实验卡', icon: FlaskConical, emoji: '🧪' },
  { path: '/calendar', label: '任务日历', icon: Calendar, emoji: '📅' },
  { path: '/channels', label: '渠道记录', icon: Megaphone, emoji: '📣' },
  { path: '/interviews', label: '访谈窗口', icon: MessageSquare, emoji: '🎙️' },
  { path: '/orders', label: '订单账本', icon: Receipt, emoji: '💰' },
  { path: '/review', label: '复盘页', icon: BarChart3, emoji: '🔍' },
  { path: '/materials', label: '素材库', icon: FolderKanban, emoji: '📁' },
];

export default function Layout() {
  const navigate = useNavigate();
  const getRisks = useAppStore((s) => s.getRisks);
  const risks = getRisks();
  const exportWeeklyReport = useAppStore((s) => s.exportWeeklyReport);

  const handleExport = () => {
    const md = exportWeeklyReport();
    downloadReport(md);
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-lab-indigo-500 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lab-amber-500 flex items-center justify-center shadow-glow-amber">
            <Beaker className="w-6 h-6 text-lab-indigo-700" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide">副业实验室</div>
            <div className="text-xs text-indigo-200">Side Hustle Lab</div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              {item.path === '/' && risks.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-coral-500 text-white text-xs flex items-center justify-center animate-pulse-slow">
                  {risks.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部操作 */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-lab-amber-500 hover:bg-lab-amber-600 text-lab-indigo-700 text-sm font-semibold transition-colors"
          >
            <FileDown className="w-4 h-4" />
            导出周报
          </button>
          <div className="text-xs text-indigo-300 text-center py-1">
            数据本地保存 · 安全私密
          </div>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-sm">🧪</span>
              <span className="text-sm text-slate-500">今日实验室状态：</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                实验进行中
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              onClick={() => navigate('/')}
            >
              <Bell className="w-5 h-5" />
              {risks.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral-500"></span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lab-amber-400 to-lab-amber-600 flex items-center justify-center text-lab-indigo-700 font-bold text-sm shadow-sm">
              U
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 bg-noise">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
