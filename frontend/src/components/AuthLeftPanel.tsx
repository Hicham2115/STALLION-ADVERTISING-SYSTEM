import type { ReactNode } from 'react';
import { Zap } from 'lucide-react';

const DASHBOARD_PREVIEW = '/images/dashboard-preview.png';

type AuthLeftPanelProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle: string;
};

export default function AuthLeftPanel({
  eyebrow = 'Agency management platform',
  title,
  subtitle,
}: AuthLeftPanelProps) {
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
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Stallion</div>
            <div className="text-amber-400 font-medium">Advertising</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-6 min-h-0">
          <p className="text-amber-400/80 text-xs font-semibold tracking-widest uppercase mb-3">
            {eyebrow}
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
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={DASHBOARD_PREVIEW}
                    alt="Stallion CEO Dashboard preview"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-lg bg-amber-500/90 text-white text-xs font-semibold shadow-lg shadow-amber-500/30">
              Live dashboard
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 shrink-0">© 2025 Stallion Advertising. All rights reserved.</p>
      </div>
    </div>
  );
}
