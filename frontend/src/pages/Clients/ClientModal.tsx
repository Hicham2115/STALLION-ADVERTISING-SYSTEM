import { useEffect, useState, useRef, FormEvent } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Client, CompanyService, ClientStatus, BillingFrequency } from '@/types';

const BILLING: BillingFrequency[] = ['MONTHLY', 'QUARTERLY', 'ANNUALLY'];

interface Props {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSaved: () => void;
}

const defaultForm = {
  name: '', services: [] as string[], monthlyFee: '',
  billingFrequency: 'MONTHLY' as BillingFrequency, status: 'ACTIVE' as ClientStatus,
  startDate: new Date().toISOString().split('T')[0], website: '', googleDriveLink: '',
  notes: '', contactPerson: '', email: '', phone: '',
};

function MultiServiceSelect({
  availableServices,
  selected,
  onToggle,
}: {
  availableServices: CompanyService[];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const label =
    selected.length === 0
      ? 'Select service...'
      : availableServices
          .filter((s) => selected.includes(s.slug))
          .map((s) => s.name)
          .join(', ');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="select w-full flex items-center justify-between text-left"
      >
        <span className={selected.length === 0 ? 'text-slate-400' : ''}>{label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {availableServices.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No services available</div>
          ) : (
            availableServices.map((s) => {
              const isSelected = selected.includes(s.slug);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onToggle(s.slug)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <span className={isSelected ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}>
                    {s.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientModal({ open, onClose, client, onSaved }: Props) {
  const { t } = useTranslation();

  const STATUSES: { value: ClientStatus; label: string }[] = [
    { value: 'ACTIVE', label: t('clients.active') },
    { value: 'PAUSED', label: t('clients.paused') },
    { value: 'PENDING', label: t('clients.pending') },
    { value: 'ONE_TIME', label: t('clients.oneTime') },
    { value: 'CANCELLED', label: t('clients.cancelled') },
  ];

  const BILLING_LABELS: Record<BillingFrequency, string> = {
    MONTHLY: t('clients.monthly'),
    QUARTERLY: t('clients.quarterly'),
    ANNUALLY: t('clients.annually'),
  };

  const [form, setForm] = useState(defaultForm);
  const [availableServices, setAvailableServices] = useState<CompanyService[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<CompanyService[]>('/services').then((r) => {
      setAvailableServices(r.data.filter((s) => s.active));
    });
  }, []);

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        services: client.services ?? [],
        monthlyFee: String(client.monthlyFee),
        billingFrequency: client.billingFrequency,
        status: client.status,
        startDate: client.startDate.split('T')[0],
        website: client.website || '',
        googleDriveLink: client.googleDriveLink || '',
        notes: client.notes || '',
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone || '',
      });
    } else {
      setForm(defaultForm);
    }
    setError('');
  }, [client, open]);

  if (!open) return null;

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (slug: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(slug)
        ? f.services.filter((s) => s !== slug)
        : [...f.services, slug],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.services.length === 0) {
      setError('Please select at least one service');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        monthlyFee: parseFloat(form.monthlyFee),
        startDate: new Date(form.startDate).toISOString(),
      };
      if (client) {
        await api.put(`/clients/${client.id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {client ? t('clients.editClient') : t('clients.modal.addNew')}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">{t('clients.modal.clientNameLabel')}</label>
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('clients.modal.clientNamePlaceholder')} />
            </div>
            <div>
              <label className="label">{t('clients.modal.serviceLabel')}</label>
              <MultiServiceSelect
                availableServices={availableServices}
                selected={form.services}
                onToggle={toggleService}
              />
            </div>
            <div>
              <label className="label">{t('clients.modal.statusLabel')}</label>
              <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as ClientStatus)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('clients.modal.monthlyFeeLabel')}</label>
              <input className="input" type="number" required min="0" step="0.01" value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">{t('clients.billingFrequency')}</label>
              <select className="select" value={form.billingFrequency} onChange={(e) => set('billingFrequency', e.target.value as BillingFrequency)}>
                {BILLING.map((b) => <option key={b} value={b}>{BILLING_LABELS[b]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('clients.modal.startDateLabel')}</label>
              <input className="input" type="date" required value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('clients.modal.websiteLabel')}</label>
              <input className="input" type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder={t('clients.modal.websitePlaceholder')} />
            </div>
            <div>
              <label className="label">{t('clients.modal.contactPersonLabel')}</label>
              <input className="input" required value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder={t('clients.modal.contactPersonPlaceholder')} />
            </div>
            <div>
              <label className="label">{t('clients.modal.emailLabel')}</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('clients.modal.emailPlaceholder')} />
            </div>
            <div>
              <label className="label">{t('clients.modal.phoneLabel')}</label>
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder={t('clients.modal.phonePlaceholder')} />
            </div>
            <div className="col-span-2">
              <label className="label">{t('clients.modal.googleDriveLabel')}</label>
              <input className="input" value={form.googleDriveLink} onChange={(e) => set('googleDriveLink', e.target.value)} placeholder={t('clients.modal.googleDrivePlaceholder')} />
            </div>
            <div className="col-span-2">
              <label className="label">{t('clients.modal.notesLabel')}</label>
              <textarea className="input min-h-20 resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('clients.modal.notesPlaceholder')} rows={3} />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button
            onClick={(e) => handleSubmit(e as any)}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? t('clients.modal.saving') : client ? t('clients.modal.saveChanges') : t('clients.addClient')}
          </button>
        </div>
      </div>
    </div>
  );
}
