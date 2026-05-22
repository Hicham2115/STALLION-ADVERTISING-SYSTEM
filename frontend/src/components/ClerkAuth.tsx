import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthenticateWithRedirectCallback,
  useAuth as useClerkAuth,
  useSignIn,
} from '@clerk/clerk-react';
import { useAuth } from '@/context/AuthContext';
import { DASHBOARD_PATH } from '@/lib/authRoutes';

const CLERK_MODE_KEY = 'stallion_clerk_mode';
const SSO_CALLBACK = '/sso-callback';

type ClerkAuthMode = 'sign-in' | 'sign-up';

type OAuthCapable = {
  authenticateWithRedirect: (params: {
    strategy: 'oauth_google';
    redirectUrl: string;
    redirectUrlComplete: string;
  }) => Promise<void>;
};

/** Exchanges a Clerk session for the app's JWT after Google OAuth. */
export function ClerkAuthSync() {
  const navigate = useNavigate();
  const { isSignedIn, getToken, signOut } = useClerkAuth();
  const { user, isLoading, loginWithClerk } = useAuth();
  const syncingRef = useRef(false);

  useEffect(() => {
    // Wait until AuthContext finishes loading its own session (fetchMe).
    // Without this guard, a returning user whose localStorage token is valid
    // would trigger an unnecessary /auth/clerk exchange on every page load.
    if (isLoading || !isSignedIn || user || syncingRef.current) return;

    syncingRef.current = true;
    (async () => {
      const storedMode = sessionStorage.getItem(CLERK_MODE_KEY) as ClerkAuthMode | null;
      const mode: ClerkAuthMode =
        storedMode === 'sign-up' ? 'sign-up' : 'sign-in';

      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          await signOut();
          return;
        }
        await loginWithClerk(clerkToken, mode);
        navigate(DASHBOARD_PATH, { replace: true });
      } catch {
        await signOut();
      } finally {
        sessionStorage.removeItem(CLERK_MODE_KEY);
        syncingRef.current = false;
      }
    })();
  }, [isLoading, isSignedIn, user, getToken, signOut, loginWithClerk, navigate]);

  return null;
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  mode: ClerkAuthMode;
  disabled?: boolean;
};

export function GoogleAuthButton({ mode, disabled }: GoogleAuthButtonProps) {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, signOut } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    if (!isLoaded || !signIn || loading || disabled) return;
    setError('');
    setLoading(true);

    try {
      if (isSignedIn) {
        await signOut();
      }

      sessionStorage.setItem(CLERK_MODE_KEY, mode);

      const oauth = signIn as unknown as OAuthCapable;
      if (!oauth.authenticateWithRedirect) {
        throw new Error('Google sign-in is not available');
      }

      await oauth.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: SSO_CALLBACK,
        redirectUrlComplete: DASHBOARD_PATH,
        fallbackRedirectUrl: SSO_CALLBACK,
        forceRedirectUrl: DASHBOARD_PATH,
      } as any);
    } catch (err: unknown) {
      sessionStorage.removeItem(CLERK_MODE_KEY);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Google sign-in failed: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={!isLoaded || !signIn || loading || disabled}
        className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-medium transition-colors flex items-center justify-center gap-3"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function SsoCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        Completing Google sign-in...
      </p>
      {/* Clerk processes the OAuth callback and redirects to redirectUrlComplete.
          ClerkAuthSync (always mounted) then exchanges the Clerk token for the app JWT. */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-slate-50 dark:bg-[#0a0f1e] px-3 text-slate-500 dark:text-slate-400">
          Or continue with email
        </span>
      </div>
    </div>
  );
}
