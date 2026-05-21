import { useState, FormEvent } from 'react';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLeftPanel from '@/components/AuthLeftPanel';

export default function PortalLogin() {
  const { login } = usePortalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060b18]">
      <AuthLeftPanel
        eyebrow="Client portal"
        title={<>Your campaign.<br /><span className="text-amber-400">Live & transparent.</span></>}
        subtitle="Track your ad performance in real time, approve creative content, monitor project progress, and stay in sync with your agency."
      />

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#060b18]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="font-bold text-xl text-white">Stallion Client Portal</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to your client dashboard</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <p className="text-xs text-slate-500 text-center">
              Having trouble signing in? Contact your account manager at{' '}
              <a href="mailto:advertisingstallion@gmail.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                advertisingstallion@gmail.com

              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
