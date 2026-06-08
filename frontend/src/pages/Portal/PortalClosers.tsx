import { useEffect, useState } from "react";
import { Users, Package, CheckCircle, DollarSign, RefreshCw } from "lucide-react";
import { portalApi } from "@/context/PortalAuthContext";
import { usePortalCurrency } from "@/context/PortalCurrencyContext";
import { cn } from "@/lib/utils";

interface CloserRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  totalOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  totalEarned: number;
  amountPaid: number;
  amountUnpaid: number;
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="w-9 h-9 rounded-xl object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function PortalClosers() {
  const { fmt } = usePortalCurrency();
  const [closers, setClosers] = useState<CloserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await portalApi.get<CloserRow[]>("/crm/closers");
      setClosers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // All closers share the same client-level stats — use the first row (or zeros if empty)
  const summary = closers[0] ?? { totalOrders: 0, shippedOrders: 0, totalEarned: 0, amountPaid: 0, amountUnpaid: 0 };

  const stats = [
    { label: "Total Closers", value: String(closers.length), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Orders", value: String(summary.totalOrders), icon: Package, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Orders Shipped", value: String(summary.shippedOrders), icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Commission", value: fmt(summary.totalEarned), icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Amount Paid", value: fmt(summary.amountPaid), icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Amount Unpaid", value: fmt(summary.amountUnpaid), icon: DollarSign, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Closers</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sales team assigned to your account</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white transition-all text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#0d1528] border border-slate-800/60 rounded-xl p-4 flex flex-col items-center text-center gap-2">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
              <Icon className={cn("w-4.5 h-4.5", color)} />
            </div>
            <div className="text-lg font-bold text-white leading-none">{value}</div>
            <div className="text-[11px] text-slate-400 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1528] border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60">
              <tr>
                {["Closer", "Total Orders", "Confirmed", "Shipped", "Commission", "Paid", "Unpaid"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : closers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No closers assigned yet.</p>
                  </td>
                </tr>
              ) : (
                closers.map((c) => {
                  const convRate = c.totalOrders > 0 ? Math.round((c.shippedOrders / c.totalOrders) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} avatar={c.avatar} />
                          <div>
                            <div className="font-semibold text-white">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">{c.totalOrders}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{c.confirmedOrders}</span>
                          {c.totalOrders > 0 && (
                            <span className="text-xs text-slate-500">
                              {Math.round((c.confirmedOrders / c.totalOrders) * 100)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{c.shippedOrders}</span>
                          {c.totalOrders > 0 && (
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium",
                              convRate >= 50 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                            )}>
                              {convRate}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-amber-400">
                        {c.totalEarned > 0 ? fmt(c.totalEarned) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                            c.amountPaid > 0 ? "bg-emerald-500/10 text-emerald-400" : "text-slate-600"
                          )}>
                            {c.amountPaid > 0 ? fmt(c.amountPaid) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {c.amountUnpaid > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-400">
                            {fmt(c.amountUnpaid)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
