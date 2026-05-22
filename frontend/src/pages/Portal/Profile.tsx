import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Lock, Upload, Eye, EyeOff,
  Camera, Building2, Clock, Calendar,
} from 'lucide-react';
import { usePortalAuth, portalApi } from '@/context/PortalAuthContext';
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils';

type Tab = 'info' | 'security';
type Toast = { message: string; type: 'success' | 'error' };

export default function PortalProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = usePortalAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('info');
  const [toast, setToast] = useState<Toast | null>(null);

  const [info, setInfo] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar: user?.avatar ?? '',
  });
  const [infoSaving, setInfoSaving] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    setInfo({
      name: user.name ?? '',
      email: user.email ?? '',
      avatar: user.avatar ?? '',
    });
  }, [user?.id, user?.name, user?.email, user?.avatar]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('portal.imageUnder2MB'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setInfo(f => ({ ...f, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!info.name.trim()) return;
    setInfoSaving(true);
    try {
      const { data } = await portalApi.put('/profile', {
        name: info.name.trim(),
        avatar: info.avatar || undefined,
      });
      updateUser({ ...user!, ...data });
      showToast(t('portal.profileUpdated'));
    } catch {
      showToast(t('portal.profileUpdateFailed'), 'error');
    } finally {
      setInfoSaving(false);
    }
  }

  function validatePwd() {
    const errs: Record<string, string> = {};
    if (!pwd.current) errs.current = t('portal.currentPasswordRequired');
    if (!pwd.next) errs.next = t('portal.newPasswordRequired');
    else if (pwd.next.length < 8) errs.next = t('portal.min8Chars');
    if (pwd.next !== pwd.confirm) errs.confirm = t('portal.passwordsDoNotMatch');
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePwd()) return;
    setPwdSaving(true);
    try {
      await portalApi.put('/change-password', {
        oldPassword: pwd.current,
        newPassword: pwd.next,
      });
      setPwd({ current: '', next: '', confirm: '' });
      showToast(t('portal.passwordChangedSuccessfully'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || t('portal.passwordChangeFailed'), 'error');
    } finally {
      setPwdSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
        )}>
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">{t('portal.myProfile')}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{t('portal.myProfileDesc')}</p>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-[#0d1528] p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {info.avatar
                ? <img src={info.avatar} alt={user.name} className="w-full h-full object-cover" />
                : getInitials(user.name)}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400">
                <Building2 className="w-3 h-3" />
                {t('portal.clientPortalBadge')}
              </span>
              {user.client?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                  {user.client.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 justify-center sm:justify-start">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('portal.joined')} {formatDate(user.createdAt)}
              </span>
              {user.lastLogin && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('portal.lastLogin')} {formatRelativeTime(user.lastLogin)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit">
        {([['info', t('portal.personalInfoTab')], ['security', t('portal.securityTab')]] as [Tab, string][]).map(([tabKey, label]) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              tab === tabKey
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="rounded-2xl border border-slate-700/50 bg-[#0d1528] p-6">
          <h3 className="text-base font-semibold text-white mb-5">{t('portal.personalInfo')}</h3>
          <form onSubmit={saveInfo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('portal.fullNameLabel')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    value={info.name}
                    onChange={e => setInfo(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('portal.fullNamePlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('portal.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 cursor-not-allowed"
                    value={info.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('portal.emailChangeHint')}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={infoSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {infoSaving
                  ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />}
                {infoSaving ? t('portal.savingProfile') : t('portal.saveProfile')}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="rounded-2xl border border-slate-700/50 bg-[#0d1528] p-6">
          <h3 className="text-base font-semibold text-white mb-1">{t('portal.changePassword')}</h3>
          <p className="text-sm text-slate-400 mb-5">{t('portal.changePasswordDesc')}</p>
          <form onSubmit={savePassword} className="space-y-5">
            {(
              [
                { key: 'current' as const },
                { key: 'next' as const },
                { key: 'confirm' as const },
              ]
            ).map(({ key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {key === 'current' ? t('portal.currentPassword') : key === 'next' ? t('portal.newPassword') : t('portal.confirmNewPassword')} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPwd[key] ? 'text' : 'password'}
                    className={cn(
                      'w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-800/60 border text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                      pwdErrors[key] ? 'border-red-500' : 'border-slate-700/50',
                    )}
                    value={pwd[key]}
                    onChange={e => { setPwd(p => ({ ...p, [key]: e.target.value })); setPwdErrors(e2 => ({ ...e2, [key]: '' })); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPwd[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdErrors[key] && <p className="text-xs text-red-400 mt-1">{pwdErrors[key]}</p>}
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwdSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {pwdSaving
                  ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Lock className="w-3.5 h-3.5" />}
                {pwdSaving ? t('portal.changingPassword') : t('portal.changePasswordBtn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
