import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_PATH } from '@/lib/authRoutes';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import { AuthDivider, GoogleAuthButton } from '@/components/ClerkAuth';
import { isClerkEnabled } from '@/lib/clerk';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(DASHBOARD_PATH, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel
        title={
          <>
            Your agency.<br />
            <span className="text-amber-400">Fully in control.</span>
          </>
        }
        subtitle="Manage clients, track revenue, nurture leads, and coordinate your team — all in one powerful platform."
      />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0f1e]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">Stallion Advertising</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Access your agency dashboard</p>

          {isClerkEnabled && (
            <>
              <GoogleAuthButton mode="sign-in" />
              <AuthDivider />
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@stallion.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Need to create an admin account?{' '}
            <Link to="/" className="text-amber-600 hover:text-amber-500 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
