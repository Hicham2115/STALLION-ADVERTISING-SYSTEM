import { useState, FormEvent } from 'react';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import logo from '@/assets/png.png';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'fr', label: 'FR', full: 'Français' },
  { code: 'ar', label: 'AR', full: 'العربية' },
];

export default function PortalLogin() {
  const { t, i18n } = useTranslation();
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
      setError(err.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060b18]">
      <AuthLeftPanel
        eyebrow={t('auth.clientPortal')}
        title={
          <>
            {t('auth.yourCampaign')}<br />
            <span className="text-amber-400">{t('auth.liveTransparent')}</span>
          </>
        }
        subtitle={t('auth.portalSubtitle')}
      />

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#060b18] relative">
        {/* Language switcher */}
        <div className="absolute top-5 right-6 flex items-center gap-1">
          <Globe className="w-4 h-4 text-slate-500 mr-1" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              title={lang.full}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                i18n.language === lang.code
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 hover:text-amber-400'
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{t('auth.welcomeBack')}</h2>
            <p className="text-slate-500 text-sm">{t('auth.signInToDashboard')}</p>
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
                {t('auth.email')}
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
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPass ? t('auth.hidePassword') : t('auth.showPassword')}
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
                  {t('auth.signingIn')}
                </span>
              ) : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <p className="text-xs text-slate-500 text-center">
              {t('auth.troubleSigningIn')}{' '}
              <a href="mailto:advertisingstallion@gmail.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                {t('auth.contactManager')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
