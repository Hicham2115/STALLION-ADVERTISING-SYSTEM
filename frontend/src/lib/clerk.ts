export const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

export const isClerkEnabled = Boolean(clerkPublishableKey);

export function clerkAppearance(isDark: boolean) {
  return {
    variables: {
      colorPrimary: '#f59e0b',
      borderRadius: '0.75rem',
      colorBackground: isDark ? '#0f172a' : '#ffffff',
      colorText: isDark ? '#f1f5f9' : '#0f172a',
      colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
      colorNeutral: isDark ? '#1e293b' : '#f1f5f9',
      colorInputBackground: isDark ? '#1e293b' : '#f8fafc',
      colorInputText: isDark ? '#f1f5f9' : '#0f172a',
    },
    elements: {
      userButtonPopoverCard: isDark
        ? 'shadow-2xl !bg-slate-900 !border !border-slate-700/60'
        : 'shadow-xl !bg-white !border !border-slate-200',
      userButtonPopoverActionButton: isDark
        ? '!text-slate-200 hover:!bg-slate-800'
        : '!text-slate-700 hover:!bg-slate-100',
      userButtonPopoverActionButtonText: isDark ? '!text-slate-200' : '!text-slate-700',
      userButtonPopoverActionButtonIcon: isDark ? '!text-slate-400' : '!text-slate-500',
      userButtonPopoverFooter: isDark ? '!bg-slate-900 !border-t !border-slate-700/60' : '!bg-slate-50 !border-t !border-slate-200',
      userPreviewMainIdentifier: isDark ? '!text-white' : '!text-slate-900',
      userPreviewSecondaryIdentifier: isDark ? '!text-slate-400' : '!text-slate-500',
      userButtonPopoverMain: isDark ? '!bg-slate-900' : '!bg-white',
      formButtonPrimary: '!bg-amber-500 hover:!bg-amber-600 !text-white',
      footerActionLink: '!text-amber-500 hover:!text-amber-400',
    },
  };
}
