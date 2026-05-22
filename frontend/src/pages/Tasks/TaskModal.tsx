import { useEffect, useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import api from "@/lib/api";
import { Task, TaskStatus, Priority, User, Client } from "@/types";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

interface Props {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  clients: Client[];
  onSaved: () => void;
}

const defaultForm = {
  title: "",
  description: "",
  assignedToId: "",
  clientId: "",
  priority: "MEDIUM" as Priority,
  dueDate: "",
  status: "TODO" as TaskStatus,
  tags: "",
};

export default function TaskModal({
  open,
  onClose,
  task,
  users,
  clients,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        assignedToId: task.assignedToId || "",
        clientId: task.clientId || "",
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        status: task.status,
        tags: (task.tags || []).join(", "),
      });
    } else {
      setForm(defaultForm);
    }
    setError("");
    setConfirmDeleteOpen(false);
    setDeleting(false);
    setDeleteError("");
  }, [task, open]);

  if (!open) return null;

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        assignedToId: form.assignedToId || null,
        clientId: form.clientId || null,
        dueDate: form.dueDate || null,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t2) => t2.trim())
              .filter(Boolean)
          : [],
      };
      if (task) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post("/tasks", payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/tasks/${task.id}`);
      onSaved();
      onClose();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || t('tasks.failedToDelete'));
    } finally {
      setDeleting(false);
    }
  };

  const PRIORITY_LABELS: Record<Priority, string> = {
    LOW: t('tasks.low'),
    MEDIUM: t('tasks.medium'),
    HIGH: t('tasks.high'),
    URGENT: t('tasks.urgent'),
  };

  const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: t('tasks.todo'),
    IN_PROGRESS: t('tasks.inProgress'),
    REVIEW: t('tasks.review'),
    COMPLETED: t('tasks.completed'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {task ? t('tasks.editTask') : t('tasks.newTask')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          <div>
            <label className="label">{t('tasks.titleLabel')} *</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t('tasks.titlePlaceholder')}
            />
          </div>
          <div>
            <label className="label">{t('common.description')}</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t('tasks.detailsPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('tasks.assignTo')}</label>
              <select
                className="select"
                value={form.assignedToId}
                onChange={(e) => set("assignedToId", e.target.value)}
              >
                <option value="">{t('tasks.unassigned')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('tasks.client')}</label>
              <select
                className="select"
                value={form.clientId}
                onChange={(e) => set("clientId", e.target.value)}
              >
                <option value="">{t('tasks.noClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('tasks.priority')}</label>
              <select
                className="select"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('tasks.status')}</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => set("status", e.target.value as TaskStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('tasks.dueDate')}</label>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('tasks.tagsLabel')}</label>
            <input
              className="input"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder={t('tasks.tagsPlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {task ? (
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              {t('tasks.deleteTask')}
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              onClick={(e) => handleSubmit(e as any)}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? t('common.saving') : task ? t('tasks.saveChanges') : t('tasks.createTask')}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete */}
      {task && confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => (deleting ? null : setConfirmDeleteOpen(false))}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('tasks.deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-slate-500">{t('common.cannotBeUndone')}</p>
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                className="btn-secondary flex-1 text-center py-2 text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60"
              >
                {deleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
