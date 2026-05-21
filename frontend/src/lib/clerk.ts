export const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

export const isClerkEnabled = Boolean(clerkPublishableKey);

export const clerkAppearance = {
  variables: {
    colorPrimary: '#f59e0b',
    borderRadius: '0.5rem',
  },
  elements: {
    userButtonPopoverCard: 'shadow-xl border border-slate-200 dark:border-slate-700',
    userButtonPopoverActionButton: 'text-slate-700 dark:text-slate-200',
    userProfileNavbar: 'border-slate-200 dark:border-slate-700',
    formButtonPrimary: 'bg-amber-500 hover:bg-amber-600 text-white',
    footerActionLink: 'text-amber-600 hover:text-amber-500',
  },
} as const;
