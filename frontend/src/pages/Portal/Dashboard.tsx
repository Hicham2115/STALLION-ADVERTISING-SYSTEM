import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DollarSign, FileText, Bell, CheckCircle, TrendingUp, Clock, ArrowRight, BarChart2, Calendar } from 'lucide-react';
import { portalApi } from '@/context/PortalAuthContext';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { usePortalCurrency } from '@/context/PortalCurrencyContext';
import { PortalDashboard, ProjectUpdate, Payment } from '@/types';
import { cn } from '@/lib/utils';

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthOptions() {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short' });
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${fmt.format(d)} ${d.getFullYear()}`,
      from: toIsoDate(start),
      to: toIsoDate(end),
    };
  });
}

const statusColors: Record<string, string> = {
  PAID: 'text-green-400 bg-green-500/10 border-green-500/20',
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  OVERDUE: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const phaseColors: Record<string, string> = {
  DISCOVERY: 'text-purple-400 bg-purple-500/10',
  PLANNING: 'text-blue-400 bg-blue-500/10',
  DESIGN: 'text-cyan-400 bg-cyan-500/10',
  DEVELOPMENT: 'text-green-400 bg-green-500/10',
  TESTING: 'text-yellow-400 bg-yellow-500/10',
  DEPLOYMENT: 'text-orange-400 bg-orange-500/10',
  MAINTENANCE: 'text-slate-400 bg-slate-500/10',
};

export default function PortalDashboardPage() {
  const { t } = useTranslation();
  const { user } = usePortalAuth();
  const { fmt } = usePortalCurrency();
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (selectedMonth) {
      const month = monthOptions().find(m => m.key === selectedMonth);
      if (month) { params.set('from', month.from); params.set('to', month.to); }
    }
    portalApi.get<PortalDashboard>(`/dashboard?${params.toString()}`).then(({ data: d }) => {
      setData(d);
    }).catch(() => {
      setError('Failed to load dashboard. Please try refreshing.');
    }).finally(() => setLoading(false));
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => setSelectedMonth(s => s)} className="text-amber-400 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">{t('portal.goodToSeeYou')}</div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {t('portal.welcomeBack')} <span className="text-amber-400">{user?.name}</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {data?.client?.name} — {data?.client?.service} &nbsp;·&nbsp; {t('portal.accountStatus')}:&nbsp;
            <span className={cn(
              'font-semibold',
              data?.client?.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400',
            )}>
              {data?.client?.status === 'ONE_TIME' ? t('portal.oneTime') : data?.client?.status}
            </span>
          </p>
        </div>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-[#0d1528]/80 border border-slate-700/60 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50 cursor-pointer"
        >
          <option value="">{t('portal.allMonths')}</option>
          {monthOptions().map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: DollarSign, label: t('portal.totalPaid'), value: fmt(data?.paidTotal ?? 0),
            color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
          },
          {
            icon: FileText, label: t('portal.pendingInvoices'), value: `${data?.pendingInvoices ?? 0}`,
            sub: data?.pendingAmount ? fmt(data.pendingAmount) : undefined,
            color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
          },
          {
            icon: CheckCircle, label: t('portal.awaitingApproval'), value: `${data?.pendingApprovals ?? 0}`,
            sub: t('portal.creativeItems'),
            color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            icon: Bell, label: t('portal.unreadAlerts'), value: `${data?.unreadNotifications ?? 0}`,
            color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-[#0d1528]/80 border border-slate-800/60 rounded-2xl p-5">
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center mb-3', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
            {sub && <div className="text-xs text-slate-500">{sub}</div>}
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent updates */}
        <div className="bg-[#0d1528]/80 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">{t('portal.recentUpdates')}</h3>
            </div>
            <Link to="/portal/updates" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              {t('portal.viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/50">
            {!data?.recentUpdates?.length ? (
              <div className="px-5 py-6 text-center text-sm text-slate-500">{t('portal.noUpdatesYet')}</div>
            ) : data.recentUpdates.map((u: ProjectUpdate) => (
              <div key={u.id} className="px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{u.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {u.phase && (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', phaseColors[u.phase])}>
                          {u.phase}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-[#0d1528]/80 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4.5 h-4.5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">{t('portal.recentInvoices')}</h3>
            </div>
            <Link to="/portal/invoices" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              {t('portal.viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/50">
            {!data?.recentPayments?.length ? (
              <div className="px-5 py-6 text-center text-sm text-slate-500">{t('portal.noInvoicesYet')}</div>
            ) : data.recentPayments.map((p: Payment) => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium">
                      {p.invoiceNumber || `INV-${p.id.slice(-6).toUpperCase()}`}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-white">{fmt(p.amount)}</span>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusColors[p.status])}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/portal/analytics', icon: BarChart2, label: t('portal.viewAnalytics'), color: 'text-blue-400' },
          { to: '/portal/content', icon: CheckCircle, label: t('portal.approveContent'), color: 'text-green-400' },
          { to: '/portal/updates', icon: TrendingUp, label: t('portal.projectUpdates'), color: 'text-amber-400' },
          { to: '/portal/invoices', icon: FileText, label: t('portal.viewInvoices'), color: 'text-purple-400' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 bg-[#0d1528]/60 border border-slate-800/50 hover:border-slate-700/70 rounded-xl p-4 transition-all group"
          >
            <Icon className={cn('w-4.5 h-4.5', color)} />
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
