import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { cn, formatDate, getInitials } from '@/lib/utils';
import {
  Building2, Users, DollarSign, ShoppingCart, Target,
  TrendingUp, ChevronDown, ChevronUp, RefreshCw,
  Crown, UserCheck, PackageCheck, Package,
} from 'lucide-react';

const MASTER_EMAIL = 'advertisingstallion@gmail.com';

interface Member {
  id: string; name: string; email: string; role: string;
  avatar?: string; active: boolean; suspended: boolean;
  lastLogin?: string; createdAt: string; isCloser: boolean;
}
interface AgencyRow {
  id: string; name: string; createdAt: string;
  superAdmin: Member | null;
  teamCount: number; totalMembers: number;
  activeClients: number; totalClients: number;
  openLeads: number; wonLeads: number; totalLeads: number;
  totalRevenue: number; monthRevenue: number;
  orders: { total: number; confirmed: number; shipped: number; delivered: number };
  revenueChart: { month: string; revenue: number }[];
  members: Member[];
}

function fmt(n: number) {
  return n.toLocaleString('en-MA', { maximumFractionDigits: 0 }) + ' MAD';
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-amber-500/15 text-amber-400',
  ADMIN: 'bg-blue-500/15 text-blue-400',
  MANAGER: 'bg-purple-500/15 text-purple-400',
  TEAM_MEMBER: 'bg-slate-500/15 text-slate-400',
};

function MiniBar({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full rounded-sm bg-amber-500/60 transition-all"
            style={{ height: `${Math.max(4, (d.revenue / max) * 36)}px` }}
            title={`${d.month}: ${fmt(d.revenue)}`}
          />
          <span className="text-[8px] text-slate-500">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/50">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color + '/20')}>
        <Icon className={cn('w-3.5 h-3.5', color)} />
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function AgencyCard({ agency }: { agency: AgencyRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{agency.name}</h3>
              <p className="text-xs text-slate-500">Created {formatDate(agency.createdAt)}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-amber-400">{fmt(agency.totalRevenue)}</div>
            <div className="text-xs text-slate-500">Total Revenue</div>
          </div>
        </div>

        {/* Owner */}
        {agency.superAdmin && (
          <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            {agency.superAdmin.avatar ? (
              <img src={agency.superAdmin.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {getInitials(agency.superAdmin.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{agency.superAdmin.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{agency.superAdmin.email}</div>
            </div>
            <div className="text-[10px] text-slate-500 flex-shrink-0">
              {agency.superAdmin.lastLogin ? `Last login ${formatDate(agency.superAdmin.lastLogin)}` : 'Never logged in'}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatPill icon={Users} label="Team" value={String(agency.totalMembers)} color="text-blue-400" />
          <StatPill icon={UserCheck} label="Clients" value={String(agency.activeClients)} color="text-emerald-400" />
          <StatPill icon={Target} label="Open Leads" value={String(agency.openLeads)} color="text-purple-400" />
          <StatPill icon={Package} label="Orders" value={String(agency.orders.total)} color="text-sky-400" />
        </div>

        {/* Orders breakdown */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-sm font-bold text-emerald-400">{agency.orders.confirmed}</div>
            <div className="text-[10px] text-slate-500">Confirmed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-sky-500/10">
            <div className="text-sm font-bold text-sky-400">{agency.orders.shipped}</div>
            <div className="text-[10px] text-slate-500">Shipped</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="text-sm font-bold text-amber-400">{fmt(agency.monthRevenue)}</div>
            <div className="text-[10px] text-slate-500">This Month</div>
          </div>
        </div>

        {/* Mini revenue chart */}
        <div className="mt-4">
          <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Revenue last 6 months
          </div>
          <MiniBar data={agency.revenueChart} />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide' : `Show all ${agency.totalMembers} members`}
        </button>
      </div>

      {/* Members table */}
      {expanded && (
        <div className="border-t border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Member', 'Role', 'Email', 'Status', 'Joined', 'Last Login'].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {agency.members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {m.avatar ? (
                          <img src={m.avatar} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {getInitials(m.name)}
                          </div>
                        )}
                        <span className="font-medium text-white">{m.name}</span>
                        {m.isCloser && <PackageCheck className="w-3 h-3 text-amber-400 flex-shrink-0" aria-label="Closer" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', ROLE_COLORS[m.role] ?? 'bg-slate-700 text-slate-300')}>
                        {m.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{m.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', m.suspended ? 'bg-red-500/15 text-red-400' : m.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400')}>
                        {m.suspended ? 'Suspended' : m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{m.lastLogin ? formatDate(m.lastLogin) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MasterDashboard() {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.email !== MASTER_EMAIL) return <Navigate to="/" replace />;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AgencyRow[]>('/master/overview');
      setAgencies(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = agencies.reduce(
    (acc, a) => ({
      revenue: acc.revenue + a.totalRevenue,
      clients: acc.clients + a.activeClients,
      members: acc.members + a.totalMembers,
      orders: acc.orders + a.orders.total,
    }),
    { revenue: 0, clients: 0, members: 0, orders: 0 },
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Master Overview</h1>
          </div>
          <p className="text-sm text-slate-500">All agencies across the platform — visible only to you</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Global totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Total Agencies', value: String(agencies.length), color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: DollarSign, label: 'Total Revenue', value: fmt(totals.revenue), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Users, label: 'Total Members', value: String(totals.members), color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: ShoppingCart, label: 'Total Orders', value: String(totals.orders), color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agency cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-1/2" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-16 bg-slate-800 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No agencies found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agencies.map((a) => <AgencyCard key={a.id} agency={a} />)}
        </div>
      )}
    </div>
  );
}
