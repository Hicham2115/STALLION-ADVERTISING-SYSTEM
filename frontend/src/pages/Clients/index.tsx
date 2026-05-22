import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ExternalLink, Archive, RotateCcw, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useConfirm } from '@/context/ToastContext';
import { Client, CompanyService, ClientStatus } from '@/types';
import { formatCurrency, formatDate, getServiceLabel, getStatusColor, cn } from '@/lib/utils';
import ClientModal from './ClientModal';

export default function Clients() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
    { value: 'ACTIVE', label: t('clients.active') },
    { value: 'PAUSED', label: t('clients.paused') },
    { value: 'PENDING', label: t('clients.pending') },
    { value: 'ONE_TIME', label: t('clients.oneTime') },
    { value: 'CANCELLED', label: t('clients.cancelled') },
  ];

  const STATUS_LABELS: Record<ClientStatus, string> = {
    ACTIVE: t('clients.active'),
    PAUSED: t('clients.paused'),
    CANCELLED: t('clients.cancelled'),
    PENDING: t('clients.pending'),
    ONE_TIME: t('clients.oneTime'),
  };

  const TABLE_HEADERS = [
    t('clients.tableHeaders.client'),
    t('clients.tableHeaders.service'),
    t('clients.tableHeaders.fee'),
    t('clients.tableHeaders.status'),
    t('clients.tableHeaders.startDate'),
    t('clients.tableHeaders.contact'),
    t('clients.tableHeaders.actions'),
  ];

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<CompanyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    api.get<CompanyService[]>('/services').then((r) => setServices(r.data));
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (service) params.set('service', service);
    if (showArchived) params.set('archived', 'true');
    const { data } = await api.get<Client[]>(`/clients?${params}`);
    setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, [search, status, service, showArchived]);

  const handleArchive = async (id: string) => {
    if (!await confirm({ title: 'Archive Client', message: t('clients.archiveConfirm'), confirmLabel: 'Archive', danger: true })) return;
    await api.delete(`/clients/${id}`);
    fetchClients();
  };

  const handleRestore = async (id: string) => {
    await api.post(`/clients/${id}/restore`);
    fetchClients();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {clients.length} {showArchived ? t('clients.archivedLabel') : t('clients.activeLabel')} {clients.length !== 1 ? t('nav.clients').toLowerCase() : t('nav.clients').toLowerCase().replace(/s$/, '')}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> {t('clients.addClient')}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder={t('clients.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-auto min-w-32" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('clients.allStatuses')}</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="select w-auto min-w-36" value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">{t('clients.allServices')}</option>
          {services.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cn('btn-secondary', showArchived && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')}
        >
          <Archive className="w-4 h-4" />
          {showArchived ? t('clients.activeLabel') : t('clients.archivedLabel')}
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-medium">{t('clients.noClients')}</p>
            <p className="text-sm mt-1">{t('clients.noClientsHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400">
                        {client.name}
                      </Link>
                      {client.website && (
                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-slate-400 hover:text-amber-500 inline-flex">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{getServiceLabel(client.service)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(client.monthlyFee)}{t('clients.perMonth')}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusColor(client.status))}>{STATUS_LABELS[client.status] ?? client.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(client.startDate)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{client.contactPerson}</div>
                      <div className="text-xs text-slate-400">{client.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditing(client); setModalOpen(true); }}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showArchived ? (
                          <button
                            onClick={() => handleRestore(client.id)}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500 rounded"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(client.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        client={editing}
        onSaved={fetchClients}
      />
    </div>
  );
}
