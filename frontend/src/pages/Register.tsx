import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_PATH } from '@/lib/authRoutes';
import api from '@/lib/api';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import { AuthDivider, GoogleAuthButton } from '@/components/ClerkAuth';
import { isClerkEnabled } from '@/lib/clerk';
import {
  parseRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from '@/schemas/register';
import type { Role } from '@/types';

type SetupStatus = {
  registrationAvailable: boolean;
  createsRole?: Role | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>;
}

export default function Register() {
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

  useEffect(() => {
    api
      .get<SetupStatus>('/auth/setup-status')
      .then(({ data }) => setSetupStatus(data))
      .catch(() => setSetupStatus({ registrationAvailable: false }));
  }, []);

  useEffect(() => {
    if (user) navigate(DASHBOARD_PATH, { replace: true });
  }, [user, navigate]);

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
      setError('Registration is not available. Please sign in with your existing account.');
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
      navigate(DASHBOARD_PATH, { replace: true });
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
          'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputErrorClass = (field: keyof RegisterFormValues) =>
    fieldErrors[field]
      ? 'input border-red-500 dark:border-red-500 focus:ring-red-500/30'
      : 'input';

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel
        title={
          <>
            Set up your <span className="text-amber-400">admin account</span>
          </>
        }
        subtitle="Full access to revenue dashboards, CRM, leads, and team tools — all in one place."
      />

      <div className="relative z-20 flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0f1e]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">
              Stallion Advertising
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {createsSuperAdmin ? 'Create admin account' : 'Create your account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {createsSuperAdmin
              ? 'Use your own email and password to set up the platform'
              : 'Sign up with your email and password to join the team'}
          </p>

          {setupStatus && !registrationAvailable && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
              Registration is currently unavailable.{' '}
              <Link
                to="/login"
                className="font-medium underline hover:no-underline pointer-events-auto"
              >
                Sign in instead
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
                Full name
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
                placeholder="Your name"
                autoComplete="name"
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div>
              <label className="label" htmlFor="register-email">
                Email address
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
                Password
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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
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
                Confirm password
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
                placeholder="Repeat your password"
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
                  Creating account...
                </>
              ) : (
                'Create account & sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-amber-600 hover:text-amber-500 font-medium pointer-events-auto"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
