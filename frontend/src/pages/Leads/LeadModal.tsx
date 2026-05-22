import { useEffect, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Lead, LeadStage, LeadSource, CompanyService, User } from '@/types';
import { formatDate } from '@/lib/utils';

const SOURCES: LeadSource[] = ['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'COLD_OUTREACH', 'EVENT'];
const STAGES: LeadStage[] = ['NEW', 'WARMED', 'CLOSED_WON', 'CLOSED_LOST'];

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  users: User[];
  onSaved: () => void;
}

const defaultForm = {
  name: '', company: '', email: '', phone: '',
  service: '', expectedValue: '',
  source: 'REFERRAL' as LeadSource, stage: 'NEW' as LeadStage,
  assignedToId: '', notes: '', followUpDate: '',
};

export default function LeadModal({ open, onClose, lead, users, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultForm);
  const [services, setServices] = useState<CompanyService[]>([]);
  const [activities, setActivities] = useState<{ id: string; note: string; createdAt: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    api.get<CompanyService[]>('/services').then((r) => {
      setServices(r.data.filter((s) => s.active));
    });
  }, []);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name,
        company: lead.company || '',
        email: lead.email,
        phone: lead.phone || '',
        service: lead.service,
        expectedValue: lead.expectedValue ? String(lead.expectedValue) : '',
        source: lead.source,
        stage: lead.stage,
        assignedToId: lead.assignedToId || '',
        notes: lead.notes || '',
        followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      });
      fetchActivities();
    } else {
      setForm(defaultForm);
      setActivities([]);
    }
    setError('');
    setTab('details');
  }, [lead, open]);

  useEffect(() => {
    if (!lead && services.length > 0 && !form.service) {
      setForm((f) => ({ ...f, service: services[0].slug }));
    }
  }, [services, lead]);

  const fetchActivities = async () => {
    if (!lead) return;
    const { data } = await api.get<Lead>(`/leads/${lead.id}`);
    setActivities((data.activities || []) as any);
  };

  if (!open) return null;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        expectedValue: form.expectedValue ? parseFloat(form.expectedValue) : null,
        assignedToId: form.assignedToId || null,
        followUpDate: form.followUpDate || null,
      };
      if (lead) {
        await api.put(`/leads/${lead.id}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!lead || !newNote.trim()) return;
    await api.post(`/leads/${lead.id}/activities`, { note: newNote });
    setNewNote('');
    fetchActivities();
  };

  const TAB_LABELS: Record<'details' | 'activity', string> = {
    details: t('leads.tabDetails'),
    activity: t('leads.tabActivity'),
  };

  const STAGE_LABELS: Record<LeadStage, string> = {
    NEW: t('leads.new'),
    WARMED: t('leads.warmed'),
    CLOSED_WON: t('leads.closedWon'),
    CLOSED_LOST: t('leads.closedLost'),
  };

  const SOURCE_LABELS: Record<LeadSource, string> = {
    REFERRAL: t('leads.sources.REFERRAL'),
    WEBSITE: t('leads.sources.WEBSITE'),
    SOCIAL_MEDIA: t('leads.sources.SOCIAL_MEDIA'),
    COLD_OUTREACH: t('leads.sources.COLD_OUTREACH'),
    EVENT: t('leads.sources.EVENT'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{lead ? `${lead.name}` : t('leads.addLead')}</h2>
            {lead && <p className="text-xs text-slate-400">{lead.company}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {lead && (
          <div className="flex gap-1 px-6 pt-3">
            {(['details', 'activity'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === tabKey ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'}`}
              >{TAB_LABELS[tabKey]}</button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6">
          {tab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('leads.leadName')} *</label>
                  <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('leads.fullNamePlaceholder')} />
                </div>
                <div>
                  <label className="label">{t('leads.company')}</label>
                  <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder={t('leads.companyPlaceholder')} />
                </div>
                <div>
                  <label className="label">{t('leads.email')} *</label>
                  <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@company.com" />
                </div>
                <div>
                  <label className="label">{t('leads.phone')}</label>
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966..." />
                </div>
                <div>
                  <label className="label">{t('leads.service')} *</label>
                  <select className="select" required value={form.service} onChange={(e) => set('service', e.target.value)}>
                    <option value="">{t('leads.selectService')}</option>
                    {services.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('leads.expectedValueMAD')}</label>
                  <input className="input" type="number" min="0" value={form.expectedValue} onChange={(e) => set('expectedValue', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="label">{t('leads.source')}</label>
                  <select className="select" value={form.source} onChange={(e) => set('source', e.target.value as LeadSource)}>
                    {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('leads.stage')}</label>
                  <select className="select" value={form.stage} onChange={(e) => set('stage', e.target.value as LeadStage)}>
                    {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('leads.assignedTo')}</label>
                  <select className="select" value={form.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
                    <option value="">{t('leads.unassigned')}</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('leads.followUpDate')}</label>
                  <input className="input" type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">{t('common.notes')}</label>
                  <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('leads.notesPlaceholder')} />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? t('common.saving') : lead ? t('leads.saveChanges') : t('leads.addLead')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={t('leads.addNotePlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                />
                <button onClick={addNote} className="btn-primary shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{a.note}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t('leads.noActivity')}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
