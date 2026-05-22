import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_PATH } from '@/lib/authRoutes';
import { Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import logo from '@/assets/png.png';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import { AuthDivider, GoogleAuthButton } from '@/components/ClerkAuth';
import { isClerkEnabled } from '@/lib/clerk';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'fr', label: 'FR', full: 'Français' },
  { code: 'ar', label: 'AR', full: 'العربية' },
];

export default function Login() {
  const { t, i18n } = useTranslation();
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
      setError(axiosErr.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel
        title={
          <>
            {t('auth.yourAgency')}<br />
            <span className="text-amber-400">{t('auth.fullyInControl')}</span>
          </>
        }
        subtitle={t('auth.agencySubtitle')}
      />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0f1e] relative">
        {/* Language switcher */}
        <div className="absolute top-5 right-6 flex items-center gap-1">
          <Globe className="w-4 h-4 text-slate-400 mr-1" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              title={lang.full}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                i18n.language === lang.code
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center mb-8">
            <img src={logo} alt={t('auth.stallionAlt')} className="h-32 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('auth.signIn')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{t('auth.accessDashboard')}</p>

          {isClerkEnabled && (
            <>
              <GoogleAuthButton mode="sign-in" />
              <AuthDivider />
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? t('auth.hidePassword') : t('auth.showPassword')}
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
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('auth.needAccount')}{' '}
            <Link to="/" className="text-amber-600 hover:text-amber-500 font-medium">
              {t('auth.registerHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
