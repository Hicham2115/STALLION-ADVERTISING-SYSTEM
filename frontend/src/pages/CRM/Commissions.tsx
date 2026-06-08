import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, CheckCircle, DollarSign, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useConfirm } from '@/context/ToastContext';
import { CommissionRule, CloserCommissionRecord, Client, User } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { useCrmCurrency } from '@/context/CrmCurrencyContext';

interface AgencyCommissionRow {
  clientId: string;
  clientName: string;
  productName: string | null;
  commissionAmount: number | null;
  shippedOrderCount: number;
  totalAmount: number;
  amountPaid: number;
  amountUnpaid: number;
}

export default function Commissions() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { fmt } = useCrmCurrency();
  const [tab, setTab] = useState<'rules' | 'records' | 'agency'>('rules');
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [records, setRecords] = useState<CloserCommissionRecord[]>([]);
  const [agencyRows, setAgencyRows] = useState<AgencyCommissionRow[]>([]);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [agencyPaidInput, setAgencyPaidInput] = useState('');
  const [agencySaving, setAgencySaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<CommissionRule | null>(null);

  const [form, setForm] = useState({
    clientId: '', closerId: '', name: '', type: 'FIXED_PER_ORDER',
    fixedAmount: '', percentage: '', description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>('/clients?limit=100'),
      api.get<any>('/users?limit=100'),
    ]).then(([c, u]) => {
      setClients(Array.isArray(c.data) ? c.data : c.data.clients || []);
      setUsers(u.data.users || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<CommissionRule[]>('/crm/commission-rules'),
      api.get<CloserCommissionRecord[]>('/crm/commissions'),
    ]).then(([r, rec]) => {
      setRules(r.data); setRecords(rec.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'agency') return;
    setAgencyLoading(true);
    api.get<AgencyCommissionRow[]>('/crm/agency-commissions')
      .then(r => setAgencyRows(r.data))
      .finally(() => setAgencyLoading(false));
  }, [tab]);

  async function saveRule() {
    setSaving(true);
    try {
      const payload = {
        ...form, closerId: form.closerId || null,
        fixedAmount: form.fixedAmount ? Number(form.fixedAmount) : null,
        percentage: form.percentage ? Number(form.percentage) : null,
      };
      if (editRule) {
        const { data } = await api.put<CommissionRule>(`/crm/commission-rules/${editRule.id}`, payload);
        setRules(r => r.map(x => x.id === data.id ? data : x));
      } else {
        const { data } = await api.post<CommissionRule>('/crm/commission-rules', payload);
        setRules(r => [data, ...r]);
      }
      setShowForm(false); setEditRule(null);
      setForm({ clientId: '', closerId: '', name: '', type: 'FIXED_PER_ORDER', fixedAmount: '', percentage: '', description: '' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id: string) {
    if (!await confirm({ title: 'Delete Rule', message: t('crm.deleteRuleConfirm'), confirmLabel: 'Delete', danger: true })) return;
    await api.delete(`/crm/commission-rules/${id}`);
    setRules(r => r.filter(x => x.id !== id));
  }

  async function payCommission(id: string) {
    const { data } = await api.put<CloserCommissionRecord>(`/crm/commissions/${id}/pay`);
    setRecords(r => r.map(x => x.id === id ? data : x));
  }

  async function saveAgencyPaid(clientId: string) {
    setAgencySaving(true);
    try {
      await api.put(`/crm/agency-commissions/${clientId}`, { amountPaid: Number(agencyPaidInput) || 0 });
      setAgencyRows(rows => rows.map(r => {
        if (r.clientId !== clientId) return r;
        const amountPaid = Number(agencyPaidInput) || 0;
        return { ...r, amountPaid, amountUnpaid: Math.max(0, r.totalAmount - amountPaid) };
      }));
      setEditingAgencyId(null);
    } finally {
      setAgencySaving(false);
    }
  }

  function openEdit(rule: CommissionRule) {
    setEditRule(rule);
    setForm({
      clientId: rule.clientId, closerId: rule.closerId || '',
      name: rule.name, type: rule.type,
      fixedAmount: rule.fixedAmount ? String(rule.fixedAmount) : '',
      percentage: rule.percentage ? String(rule.percentage) : '',
      description: rule.description || '',
    });
    setShowForm(true);
  }

  const pendingTotal = records.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);
  const paidTotal = records.filter(r => r.paid).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('crm.commissionManagement')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('crm.rulesAndPayouts')}</p>
        </div>
        {tab === 'rules' && (
          <button onClick={() => { setShowForm(true); setEditRule(null); setForm({ clientId: '', closerId: '', name: '', type: 'FIXED_PER_ORDER', fixedAmount: '', percentage: '', description: '' }); }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('crm.addRule')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('crm.totalRules'), value: rules.length.toString(), icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: t('crm.pendingPayout'), value: fmt(pendingTotal), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t('crm.totalPaid'), value: fmt(paidTotal), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['rules', 'records', 'agency'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === tb ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {tb === 'rules' ? t('crm.commissionRulesTab') : tb === 'records' ? t('crm.payoutRecords') : 'Agency Commission'}
          </button>
        ))}
      </div>

      {/* Commission Rules */}
      {tab === 'rules' && (
        <>
          {showForm && (
            <div className="card p-5 border-2 border-amber-400/30">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {editRule ? t('crm.editRule') : t('crm.newCommissionRule')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('crm.ruleName')} *</label>
                  <input className="input mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Fixed" />
                </div>
                <div>
                  <label className="label">{t('crm.allClients').replace('All ', '')} *</label>
                  <select className="select mt-1" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">{t('crm.allClients')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('crm.closerOptional')}</label>
                  <select className="select mt-1" value={form.closerId} onChange={e => setForm(f => ({ ...f, closerId: e.target.value }))}>
                    <option value="">{t('crm.allClosers')}</option>
                    {users.filter(u => u.isCloser).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('crm.commissionType')}</label>
                  <select className="select mt-1" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="FIXED_PER_ORDER">{t('crm.fixedPerOrder')}</option>
                    <option value="PERCENTAGE">{t('crm.percentageOfSale')}</option>
                  </select>
                </div>
                {form.type === 'FIXED_PER_ORDER' ? (
                  <div>
                    <label className="label">{t('crm.fixedAmount')}</label>
                    <input className="input mt-1" type="number" step="0.01" value={form.fixedAmount} onChange={e => setForm(f => ({ ...f, fixedAmount: e.target.value }))} placeholder="20" />
                  </div>
                ) : (
                  <div>
                    <label className="label">{t('crm.percentageLabel')}</label>
                    <input className="input mt-1" type="number" step="0.1" max="100" value={form.percentage} onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))} placeholder="5" />
                  </div>
                )}
                <div>
                  <label className="label">{t('common.description')}</label>
                  <input className="input mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowForm(false); setEditRule(null); }} className="btn-secondary px-4 py-2 text-sm">{t('common.cancel')}</button>
                <button onClick={saveRule} disabled={saving || !form.name} className="btn-primary px-6 py-2 text-sm flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? t('common.saving') : t('crm.saveRule')}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', rule.active ? 'bg-amber-500/10' : 'bg-slate-200 dark:bg-slate-700')}>
                    <Award className={cn('w-5 h-5', rule.active ? 'text-amber-500' : 'text-slate-400')} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{rule.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {rule.type === 'FIXED_PER_ORDER'
                        ? `${rule.fixedAmount} MAD ${t('crm.perShippedOrder')}`
                        : `${rule.percentage}% ${t('crm.percentOfSale')}`}
                      {rule.client && ` · ${rule.client.name}`}
                      {rule.closer && ` · ${rule.closer.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('badge text-xs', rule.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500')}>
                    {rule.active ? t('crm.active') : t('crm.inactive')}
                  </span>
                  <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {rules.length === 0 && !loading && (
              <div className="card p-12 text-center text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('crm.noCommissionRules')}</p>
                <p className="text-xs mt-1">{t('crm.createRulesHint')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payout Records — grouped by closer */}
      {/* Agency Commission */}
      {tab === 'agency' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Client', 'Total Amount', 'Amount Paid', 'Amount Unpaid', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agencyLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : agencyRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No clients with commission amount configured.
                    </td>
                  </tr>
                ) : agencyRows.map(row => (
                  <tr key={row.clientId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{row.clientName}</div>
                      {row.productName && (
                        <div className="text-xs text-slate-400 mt-0.5">{row.productName} · {row.shippedOrderCount} shipped</div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                      {fmt(row.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      {editingAgencyId === row.clientId ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          autoFocus
                          className="input w-32 text-sm"
                          value={agencyPaidInput}
                          onChange={e => setAgencyPaidInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveAgencyPaid(row.clientId); if (e.key === 'Escape') setEditingAgencyId(null); }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">Paid</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(row.amountPaid)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">Unpaid</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(row.amountUnpaid)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {editingAgencyId === row.clientId ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveAgencyPaid(row.clientId)}
                            disabled={agencySaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
                          >
                            {agencySaving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Save
                          </button>
                          <button onClick={() => setEditingAgencyId(null)} className="px-2 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-700">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingAgencyId(row.clientId); setAgencyPaidInput(String(row.amountPaid)); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'records' && (() => {
        const grouped = records.reduce<Record<string, {
          closerId: string;
          closerName: string;
          paid: number;
          unpaid: number;
          pendingIds: string[];
        }>>((acc, r) => {
          const id = r.closerId;
          const name = r.closer?.name || r.closerId;
          if (!acc[id]) acc[id] = { closerId: id, closerName: name, paid: 0, unpaid: 0, pendingIds: [] };
          if (r.paid) {
            acc[id].paid += r.amount;
          } else {
            acc[id].unpaid += r.amount;
            acc[id].pendingIds.push(r.id);
          }
          return acc;
        }, {});
        const rows = Object.values(grouped);

        return (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {[t('crm.colCloser'), t('crm.totalPaid'), t('crm.pendingPayout'), ''].map((h, i) => (
                      <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map(row => (
                    <tr key={row.closerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                        {row.closerName}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                            {t('crm.paid')}
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(row.paid)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                            {t('crm.pending')}
                          </span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(row.unpaid)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {row.unpaid > 0 && (
                          <button
                            onClick={async () => {
                              await Promise.all(row.pendingIds.map(id => payCommission(id)));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> {t('crm.markPaid')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && !loading && (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-400">{t('crm.noCommissionRecords')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
