import { useState, FormEvent, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_PATH } from '@/lib/authRoutes';
import api from '@/lib/api';
import { Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import logo from '@/assets/png.png';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import { AuthDivider, GoogleAuthButton } from '@/components/ClerkAuth';
import { isClerkEnabled } from '@/lib/clerk';
import {
  parseRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from '@/schemas/register';
import type { Role } from '@/types';
import { useTranslation } from 'react-i18next';
import AuthSuccessScreen from '@/components/AuthSuccessScreen';

type SetupStatus = {
  registrationAvailable: boolean;
  createsRole?: Role | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>;
}

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'fr', label: 'FR', full: 'Français' },
  { code: 'ar', label: 'AR', full: 'العربية' },
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    api
      .get<SetupStatus>('/auth/setup-status')
      .then(({ data }) => setSetupStatus(data))
      .catch(() => setSetupStatus({ registrationAvailable: false }));
  }, []);

  useEffect(() => {
    if (user && !showSuccess) navigate(DASHBOARD_PATH, { replace: true });
  }, [user, navigate, showSuccess]);

  const handleDone = useCallback(() => {
    navigate(DASHBOARD_PATH, { replace: true });
  }, [navigate]);

  const registrationAvailable = setupStatus?.registrationAvailable ?? false;
  const createsSuperAdmin = setupStatus?.createsRole === 'SUPER_ADMIN';

  const clearFieldError = (field: keyof RegisterFormValues) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!registrationAvailable) {
      setError(t('auth.registrationNotAvailable'));
      return;
    }

    const values: RegisterFormValues = {
      name,
      email,
      password,
      confirmPassword,
    };

    const validation = parseRegisterForm(values);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await register(
        validation.data.name,
        validation.data.email,
        validation.data.password,
      );
      setShowSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: RegisterFieldErrors };
        };
      };
      const apiErrors = axiosErr.response?.data?.errors;
      if (apiErrors && Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
      }
      setError(
        axiosErr.response?.data?.message ||
          t('auth.registrationFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const inputErrorClass = (field: keyof RegisterFormValues) =>
    fieldErrors[field]
      ? 'input border-red-500 dark:border-red-500 focus:ring-red-500/30'
      : 'input';

  if (showSuccess) {
    return <AuthSuccessScreen userName={user?.name ?? name} onDone={handleDone} isRegister />;
  }

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel
        title={
          <>
            {t('auth.setupAdminTitle')} <span className="text-amber-400">{t('auth.adminAccount')}</span>
          </>
        }
        subtitle={t('auth.adminSubtitle')}
      />

      <div className="relative z-20 flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0f1e]">
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

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {createsSuperAdmin ? t('auth.createAdminAccount') : t('auth.createYourAccount')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {createsSuperAdmin
              ? t('auth.setupAdminDesc')
              : t('auth.signUpDesc')}
          </p>

          {setupStatus && !registrationAvailable && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
              {t('auth.registrationUnavailable')}{' '}
              <Link
                to="/login"
                className="font-medium underline hover:no-underline pointer-events-auto"
              >
                {t('auth.signInInstead')}
              </Link>
            </div>
          )}

          {isClerkEnabled && registrationAvailable && (
            <>
              <GoogleAuthButton mode="sign-up" />
              <AuthDivider />
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="register-name">
                {t('auth.fullName')}
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                className={inputErrorClass('name')}
                placeholder={t('auth.namePlaceholder')}
                autoComplete="name"
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div>
              <label className="label" htmlFor="register-email">
                {t('auth.email')}
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={inputErrorClass('email')}
                placeholder="you@yourcompany.com"
                autoComplete="email"
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div>
              <label className="label" htmlFor="register-password">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  className={`${inputErrorClass('password')} pr-10`}
                  placeholder={t('auth.atLeast8Chars')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <FieldError message={fieldErrors.password} />
            </div>

            <div>
              <label className="label" htmlFor="register-confirm-password">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="register-confirm-password"
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                className={inputErrorClass('confirmPassword')}
                placeholder={t('auth.repeatPassword')}
                autoComplete="new-password"
              />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || setupStatus === null || !registrationAvailable}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('auth.creatingAccount')}
                </>
              ) : (
                t('auth.createAccount')
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="text-amber-600 hover:text-amber-500 font-medium pointer-events-auto"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
