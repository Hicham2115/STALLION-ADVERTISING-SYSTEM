import { useEffect } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PortalAuthProvider } from '@/context/PortalAuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { clerkPublishableKey, isClerkEnabled } from '@/lib/clerk';

/** Clears the app JWT when the user signs out from the Clerk account menu. */
function ClerkSessionBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user, token, clearAppSession } = useAuth();

  useEffect(() => {
    if (!isLoaded || !token || !user?.clerkId) return;
    if (!isSignedIn) {
      clearAppSession();
    }
  }, [isLoaded, isSignedIn, token, user?.clerkId, clearAppSession]);

  return <>{children}</>;
}

import { ClerkAuthSync } from '@/components/ClerkAuth';

function AuthProviderWithClerk({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  return (
    <AuthProvider clerkSignOut={signOut}>
      <ClerkSessionBridge>
        {children}
        <ClerkAuthSync />
      </ClerkSessionBridge>
    </AuthProvider>
  );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const inner = (
    <ThemeProvider>
      {isClerkEnabled ? (
        <AuthProviderWithClerk>{children}</AuthProviderWithClerk>
      ) : (
        <AuthProvider>{children}</AuthProvider>
      )}
    </ThemeProvider>
  );

  return isClerkEnabled ? (
    <ClerkProvider 
      publishableKey={clerkPublishableKey} 
      afterSignOutUrl="/login"
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <PortalAuthProvider>
        <CurrencyProvider>{inner}</CurrencyProvider>
      </PortalAuthProvider>
    </ClerkProvider>
  ) : (
    <PortalAuthProvider>
      <CurrencyProvider>{inner}</CurrencyProvider>
    </PortalAuthProvider>
  );
}
