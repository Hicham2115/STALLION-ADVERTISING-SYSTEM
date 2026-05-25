import { useEffect, useState } from 'react';
import logo from '@/assets/png.png';

interface AuthSuccessScreenProps {
  userName?: string;
  onDone: () => void;
  isRegister?: boolean;
}

export default function AuthSuccessScreen({ userName, onDone, isRegister = false }: AuthSuccessScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar to 100% over 1.6s then call onDone
    const start = performance.now();
    const duration = 1600;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 80);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080d1a]">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 w-72">
        {/* Logo */}
        <div
          className="flex items-center justify-center"
          style={{ animation: 'authFadeUp 0.5s ease both' }}
        >
          <img src={logo} alt="Stallion" className="h-20 w-auto object-contain" />
        </div>

        {/* Welcome text */}
        <div
          className="text-center space-y-1"
          style={{ animation: 'authFadeUp 0.5s 0.15s ease both', opacity: 0 }}
        >
          <p className="text-lg font-bold text-white">
            {isRegister ? 'Account created!' : 'Welcome back'}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </p>
          <p className="text-sm text-slate-400">
            {isRegister ? 'Setting up your workspace…' : 'Loading your dashboard…'}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-full space-y-2"
          style={{ animation: 'authFadeUp 0.5s 0.25s ease both', opacity: 0 }}
        >
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 text-right">{Math.round(progress)}%</p>
        </div>

        {/* Spinning dots */}
        <div
          className="flex items-center gap-1.5"
          style={{ animation: 'authFadeUp 0.5s 0.3s ease both', opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-500/60"
              style={{ animation: `authDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authDot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40%            { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
