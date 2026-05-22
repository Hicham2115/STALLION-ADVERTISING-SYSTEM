import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useConfirm } from '@/context/ToastContext';
import { MeetingType } from '@/types';
import { cn } from '@/lib/utils';

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];
const DURATIONS = [15, 30, 45, 60, 90, 120];

type FormState = { name: string; duration: number; description: string; color: string };

export default function MeetingTypesManager() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MeetingType | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', duration: 30, description: '', color: '#f59e0b' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get<MeetingType[]>('/meetings/types').then(r => setTypes(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', duration: 30, description: '', color: '#f59e0b' });
    setShowForm(true);
  };

  const openEdit = (mt: MeetingType) => {
    setEditing(mt);
    setForm({ name: mt.name, duration: mt.duration, description: mt.description || '', color: mt.color });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/meetings/types/${editing.id}`, form);
      else await api.post('/meetings/types', form);
      await load();
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Meeting Type', message: t('meetings.deleteTypeConfirm'), confirmLabel: 'Delete', danger: true })) return;
    await api.delete(`/meetings/types/${id}`);
    setTypes(t => t.filter(x => x.id !== id));
  };

  const toggleActive = async (mt: MeetingType) => {
    await api.put(`/meetings/types/${mt.id}`, { active: !mt.active });
    setTypes(prev => prev.map(x => x.id === mt.id ? { ...x, active: !x.active } : x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{t('meetings.types')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('meetings.typesDesc')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('meetings.addType')}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900 dark:text-white">{editing ? t('meetings.editType') : t('meetings.newMeetingType')}</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">{t('common.name')} *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('meetings.meetingTitlePlaceholder')} />
            </div>
            <div>
              <label className="label">{t('meetings.duration')}</label>
              <select className="select" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} {t('meetings.minutes')}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="label">{t('common.description')}</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('meetings.descriptionPlaceholder')} />
          </div>
          <div className="mb-4">
            <label className="label">{t('meetings.color')}</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={cn('w-7 h-7 rounded-full border-2 transition-all', form.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" /> {saving ? t('meetings.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map(mt => (
          <div key={mt.id} className={cn('card p-4 border-l-4 transition-all', !mt.active && 'opacity-60')} style={{ borderLeftColor: mt.color }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mt.color }} />
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{mt.name}</h4>
                </div>
                <p className="text-xs text-slate-500">{mt.duration} {t('meetings.minutes')}</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={mt.active} onChange={() => toggleActive(mt)} className="sr-only" />
                <div className={cn('w-8 h-4 rounded-full transition-colors relative', mt.active ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700')}>
                  <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all', mt.active ? 'left-4.5' : 'left-0.5')} style={{ left: mt.active ? '17px' : '2px' }} />
                </div>
              </label>
            </div>
            {mt.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{mt.description}</p>}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => openEdit(mt)} className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                <Pencil className="w-3 h-3" /> {t('common.edit')}
              </button>
              <button onClick={() => handleDelete(mt.id)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                <Trash2 className="w-3 h-3" /> {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {types.length === 0 && !showForm && (
          <div className="col-span-3 text-center py-10 text-slate-400 text-sm">
            {t('meetings.noMeetingTypes')}
          </div>
        )}
      </div>
    </div>
  );
}
