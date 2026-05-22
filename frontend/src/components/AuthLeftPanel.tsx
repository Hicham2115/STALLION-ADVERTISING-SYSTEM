import type { ReactNode } from 'react';
import logo from '@/assets/png.png';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react';

type AuthLeftPanelProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle: string;
};

export default function AuthLeftPanel({
  eyebrow,
  title,
  subtitle,
}: AuthLeftPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0">
        <div className="absolute top-16 left-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-8 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
      </div>

      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.07]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="rgba(245,158,11,0.5)"
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L0,320Z"
        />
      </svg>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full min-h-0">
        <div className="flex items-center shrink-0">
          <img src={logo} alt={t('auth.stallionAlt')} className="h-36 w-auto object-contain" />
        </div>

        <div className="flex-1 flex flex-col justify-center py-6 min-h-0">
          <p className="text-amber-400/80 text-xs font-semibold tracking-widest uppercase mb-3">
            {eyebrow ?? t('auth.agencyPlatform')}
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3 max-w-md">
            {title}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-8">{subtitle}</p>

          <div className="relative w-full max-w-lg mx-auto lg:mx-0">
            <div className="absolute -inset-6 bg-gradient-to-tr from-amber-500/20 via-transparent to-blue-500/10 rounded-[2rem] blur-2xl" />
            <div className="relative rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out">
              <div className="rounded-2xl border border-slate-600/80 bg-slate-900/90 shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/10">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                  <span className="ml-2 flex-1 h-5 rounded-md bg-slate-700/60 border border-slate-600/50" />
                </div>
                {/* Mini dashboard preview */}
                <div className="bg-white p-3 text-[10px] select-none">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">CEO Dashboard</p>
                      <p className="text-slate-400 text-[9px]">Live Performance Overview</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[8px]">MAD</span>
                      <span className="px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 text-[8px]">USD</span>
                      <div className="ml-1 text-right">
                        <p className="text-[8px] text-slate-400">Annual Run Rate</p>
                        <p className="font-bold text-amber-500 text-[10px]">1.2M MAD</p>
                      </div>
                    </div>
                  </div>

                  {/* Metric cards row 1 */}
                  <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                    {[
                      { icon: DollarSign, label: 'Monthly Revenue', value: '98,400 MAD', sub: '↑ 24.3%', green: true },
                      { icon: Users,      label: 'Active Clients',  value: '18',         sub: '3 new this month', green: false },
                      { icon: TrendingUp, label: 'Profit Margin',   value: '38%',        sub: '↑ 6pts',  green: true },
                      { icon: Zap,        label: 'Lead Conv.',      value: '62%',        sub: '↑ 12pts', green: true },
                    ].map(({ icon: Icon, label, value, sub, green }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <Icon className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <p className="text-slate-400 leading-none" style={{ fontSize: '7px' }}>{label}</p>
                        </div>
                        <p className="font-bold text-slate-800 leading-tight text-[9px]">{value}</p>
                        <p className={`leading-none mt-0.5 font-medium ${green ? 'text-emerald-500' : 'text-slate-400'}`} style={{ fontSize: '7px' }}>{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Row 2 summary strip */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                      { label: 'Yearly Revenue', value: '842,000 MAD', color: 'text-emerald-600' },
                      { label: 'Monthly Profit',  value: '+31,200 MAD',  color: 'text-emerald-600' },
                      { label: 'Client Retention', value: '94%',         color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p className="text-slate-400 leading-none mb-0.5" style={{ fontSize: '7px' }}>{label}</p>
                        <p className={`font-bold ${color} text-[9px]`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart bars + performance indicators side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Mini bar chart */}
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <p className="text-slate-500 font-semibold mb-1.5 text-[8px]">Revenue vs Expenses</p>
                      <div className="flex items-end gap-1 h-10">
                        {[40, 55, 48, 65, 72, 68, 85, 90, 88, 95, 92, 98].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                            <div className="w-full rounded-t-sm bg-emerald-400/80" style={{ height: `${h * 0.4}px` }} />
                            <div className="w-full rounded-t-sm bg-red-300/60" style={{ height: `${(100 - h) * 0.18}px` }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="flex items-center gap-0.5" style={{ fontSize: '6px' }}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Revenue</span>
                        <span className="flex items-center gap-0.5" style={{ fontSize: '6px' }}><span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" /> Expenses</span>
                      </div>
                    </div>

                    {/* Performance indicators */}
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <p className="text-slate-500 font-semibold mb-1.5 text-[8px]">Performance</p>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Profit Margin',    pct: 38, color: 'bg-emerald-500' },
                          { label: 'Client Retention', pct: 94, color: 'bg-emerald-500' },
                          { label: 'Lead Conversion',  pct: 62, color: 'bg-emerald-400' },
                          { label: 'Team Productivity',pct: 81, color: 'bg-emerald-400' },
                        ].map(({ label, pct, color }) => (
                          <div key={label}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-slate-500" style={{ fontSize: '7px' }}>{label}</span>
                              <span className="text-emerald-600 font-bold" style={{ fontSize: '7px' }}>{pct}%</span>
                            </div>
                            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-lg bg-amber-500/90 text-white text-xs font-semibold shadow-lg shadow-amber-500/30">
              {t('auth.liveDashboard')}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 shrink-0">{t('auth.copyright')}</p>
      </div>
    </div>
  );
}
