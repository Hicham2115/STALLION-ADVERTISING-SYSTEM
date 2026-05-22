import { useEffect } from 'react';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { Shield, Calendar, Clock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { clerkAppearance } from '@/lib/clerk';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { Role } from '@/types';

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TEAM_MEMBER: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function ClerkProfileView() {
  const { t } = useTranslation();
  const { user, syncClerkProfile } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    if (!user?.clerkId || !isLoaded) return;
    void syncClerkProfile().catch(() => {});
  }, [user?.clerkId, clerkUser?.id, clerkUser?.imageUrl, clerkUser?.fullName, isLoaded, syncClerkProfile]);

  const ROLE_LABELS: Record<Role, string> = {
    SUPER_ADMIN: t('profile.roleSuperAdmin'),
    ADMIN: t('profile.roleAdmin'),
    MANAGER: t('profile.roleManager'),
    TEAM_MEMBER: t('profile.roleTeamMember'),
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn('badge text-xs', ROLE_COLORS[user.role])}>
                <Shield className="w-3 h-3 mr-1" />
                {ROLE_LABELS[user.role]}
              </span>
              <span className="badge text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Check className="w-3 h-3 mr-1" />
                {t('profile.googleAccount')}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('profile.joined')} {formatDate(user.createdAt)}
              </span>
              {user.lastLogin && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('profile.lastLogin')} {formatRelativeTime(user.lastLogin)}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {t('profile.managedThrough')}
          </p>
        </div>
      </div>

      <div className="card p-4 sm:p-6 overflow-hidden">
        <UserProfile routing="hash" appearance={clerkAppearance} />
      </div>
    </div>
  );
}
