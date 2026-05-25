import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  ShoppingCart,
  CheckCircle,
  XCircle,
  DollarSign,
  Award,
  Package,
  Truck,
  BarChart3,
} from "lucide-react";
import api from "@/lib/api";
import { Client } from "@/types";
import { cn } from "@/lib/utils";
import { useCrmCurrency } from "@/context/CrmCurrencyContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalNetProfit: number;
    totalAdSpend: number;
    totalProductCost: number;
    totalLinkedCosts: number;
    totalShipping: number;
    confirmed: number;
    shipped?: number;
    delivered: number;
    cancelled: number;
    returned: number;
    avgOrderValue: number;
    conversionRate: number;
    totalCommissions: number;
  };
  monthly: { month: string; revenue: number; profit: number; orders: number }[];
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  topCities: { city: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#6366f1",
  PENDING_CONFIRMATION: "#f59e0b",
  CONFIRMED: "#10b981",
  NO_ANSWER: "#94a3b8",
  CANCELLED: "#ef4444",
  REFUSED: "#f97316",
  SHIPPED: "#3b82f6",
  DELIVERED: "#22c55e",
  RETURNED: "#e11d48",
};

const SOURCE_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#94a3b8",
];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthOptions() {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: `${fmt.format(date)} ${date.getFullYear()}`,
      from: toIsoDate(start),
      to: toIsoDate(end),
    };
  });
}

const DATE_PRESETS = [
  { value: "today",    label: "Today" },
  { value: "last_7d",  label: "7 Days" },
  { value: "last_30d", label: "30 Days" },
  { value: "last_90d", label: "90 Days" },
];

function getPresetRange(preset: string): { from: string; to: string } | null {
  const today = new Date();
  const to = toIsoDate(today);
  if (preset === "today") return { from: to, to };
  if (preset === "last_7d") { const d = new Date(); d.setDate(d.getDate() - 6); return { from: toIsoDate(d), to }; }
  if (preset === "last_30d") { const d = new Date(); d.setDate(d.getDate() - 29); return { from: toIsoDate(d), to }; }
  if (preset === "last_90d") { const d = new Date(); d.setDate(d.getDate() - 89); return { from: toIsoDate(d), to }; }
  return null;
}

interface Props {
  onNavigate?: (tab: string) => void;
  analyticsMode?: boolean;
}

export default function CrmDashboard({ onNavigate, analyticsMode }: Props) {
  const { t } = useTranslation();
  const { fmt } = useCrmCurrency();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ users: Client[] } | Client[]>("/clients?limit=100").then((r) => {
      const list = Array.isArray(r.data)
        ? r.data
        : (r.data as any).clients || [];
      setClients(list);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClient) params.set("clientId", selectedClient);
    if (selectedMonth) {
      const month = monthOptions().find((m) => m.key === selectedMonth);
      if (month) {
        params.set("from", month.from);
        params.set("to", month.to);
      }
    } else if (datePreset) {
      const range = getPresetRange(datePreset);
      if (range) { params.set("from", range.from); params.set("to", range.to); }
    }
    api
      .get<AnalyticsData>(`/crm/analytics?${params.toString()}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [selectedClient, selectedMonth, datePreset]);

  const s = data?.summary;

  const mergedCancelled = s ? s.cancelled + s.returned : 0;

  const mergedByStatus = (() => {
    const list = data?.byStatus || [];
    const out: { status: string; count: number }[] = [];
    const indexByStatus: Record<string, number> = {};
    for (const entry of list) {
      const status = entry.status === "RETURNED" ? "CANCELLED" : entry.status;
      const existingIndex = indexByStatus[status];
      if (existingIndex === undefined) {
        indexByStatus[status] = out.length;
        out.push({ status, count: entry.count });
      } else {
        out[existingIndex].count += entry.count;
      }
    }
    return out;
  })();

  const shippedCount =
    s?.shipped ??
    (data?.byStatus || []).reduce((sum, entry) => {
      if (entry.status === "SHIPPED" || entry.status === "DELIVERED") {
        return sum + entry.count;
      }
      return sum;
    }, 0);

  const kpis = s
    ? [
        {
          label: t('crm.totalRevenue'),
          value: fmt(s.totalRevenue),
          icon: DollarSign,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
        {
          label: t('crm.netProfit'),
          value: fmt(s.totalNetProfit),
          icon: TrendingUp,
          color: s.totalNetProfit >= 0 ? "text-emerald-500" : "text-red-500",
          bg: s.totalNetProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
        },
        {
          label: t('crm.totalOrders'),
          value: s.totalOrders.toString(),
          icon: ShoppingCart,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: t('crm.confirmed'),
          value: s.confirmed.toString(),
          icon: CheckCircle,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: t('crm.shipped'),
          value: shippedCount.toString(),
          icon: Truck,
          color: "text-sky-500",
          bg: "bg-sky-500/10",
        },
        {
          label: t('crm.cancelled'),
          value: mergedCancelled.toString(),
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
        },
        {
          label: t('crm.conversionRate'),
          value: `${s.conversionRate}%`,
          icon: BarChart3,
          color: "text-purple-500",
          bg: "bg-purple-500/10",
        },
        {
          label: t('crm.averageOrder'),
          value: fmt(s.avgOrderValue),
          icon: Package,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
        },
        {
          label: t('crm.adSpend'),
          value: fmt(s.totalAdSpend),
          icon: TrendingUp,
          color: "text-pink-500",
          bg: "bg-pink-500/10",
        },
        {
          label: t('crm.commissions'),
          value: fmt(s.totalCommissions),
          icon: Award,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
        },
        {
          label: t('crm.totalCosts'),
          value: fmt(s.totalLinkedCosts > 0 ? s.totalLinkedCosts : s.totalProductCost),
          icon: Package,
          color: "text-slate-400",
          bg: "bg-slate-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {analyticsMode ? t('crm.profitAnalytics') : t('crm.dashboard')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {analyticsMode
              ? t('crm.deepFinancialInsights')
              : t('crm.businessOverview')}
          </p>
        </div>
        <div className="w-full xl:w-auto flex flex-wrap gap-3">
          <select
            className="select flex-1 min-w-[130px]"
            value={datePreset}
            onChange={(e) => { setDatePreset(e.target.value); setSelectedMonth(""); }}
          >
            <option value="">All Time</option>
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            className="select flex-1 min-w-[160px]"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">{t('crm.allClients')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="select flex-1 min-w-[130px]"
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setDatePreset(""); }}
          >
            <option value="">{t('crm.allMonths')}</option>
            {monthOptions().map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {kpis.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-4 flex flex-col gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    bg,
                  )}
                >
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Profit Breakdown */}
          {s && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.profitBreakdown')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    label: t('crm.revenue'),
                    value: s.totalRevenue,
                    color: "bg-amber-500",
                  },
                  {
                    label: t('crm.productCostLabel'),
                    value: -s.totalProductCost,
                    color: "bg-red-400",
                  },
                  {
                    label: t('crm.shippingLabel'),
                    value: -s.totalShipping,
                    color: "bg-red-400",
                  },
                  {
                    label: t('crm.adSpendLabel'),
                    value: -s.totalAdSpend,
                    color: "bg-red-400",
                  },
                  {
                    label: t('crm.netProfitLabel'),
                    value: s.totalNetProfit,
                    color:
                      s.totalNetProfit >= 0 ? "bg-emerald-500" : "bg-red-600",
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className={cn(
                        "text-white rounded-xl py-3 px-2 font-bold text-sm",
                        item.color,
                      )}
                    >
                      {fmt(Math.abs(item.value))}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Revenue & Profit trend */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.revenueProfit')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.monthly || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t('crm.revenue')}
                    stroke="#f59e0b"
                    fill="url(#revGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name={t('crm.netProfit')}
                    stroke="#10b981"
                    fill="url(#profGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by status */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.ordersByStatus')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={mergedByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {mergedByStatus.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: 8,
                    }}
                  />
                  <Legend formatter={(v) => v.replace(/_/g, " ")} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Orders per month */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.monthlyOrders')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.monthly || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="orders"
                    name={t('crm.orders')}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Source breakdown */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.ordersBySource')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.bySource || []} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                    width={90}
                    tickFormatter={(v) => v.replace(/_/g, " ")}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" name={t('crm.orders')} radius={[0, 4, 4, 0]}>
                    {(data?.bySource || []).map((_, i) => (
                      <Cell
                        key={i}
                        fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top cities */}
          {(data?.topCities?.length ?? 0) > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {t('crm.topCities')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {data!.topCities.map((c, i) => (
                  <div
                    key={c.city}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center"
                  >
                    <div className="text-2xl font-bold text-amber-500">
                      #{i + 1}
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mt-1">
                      {c.city}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('crm.cityOrders', { count: c.count })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          {!analyticsMode && onNavigate && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t('crm.manageOrders'), tab: "orders", color: "btn-primary" },
                {
                  label: t('crm.closersPerformance'),
                  tab: "closers",
                  color: "btn-secondary",
                },
                {
                  label: t('crm.commissionRules'),
                  tab: "commissions",
                  color: "btn-secondary",
                },
                {
                  label: t('crm.shopifySync'),
                  tab: "shopify",
                  color: "btn-secondary",
                },
              ].map(({ label, tab, color }) => (
                <button
                  key={tab}
                  onClick={() => onNavigate(tab)}
                  className={cn(color, "py-2 text-sm")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
