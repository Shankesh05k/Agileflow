import { useState, useEffect, FormEvent } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Ticket, WorkflowState, TicketType, TicketPriority } from '../types';
import { tickets as ticketsApi } from '../lib/api';
import { Button } from './ui/Button';
import { TypeBadge, PriorityBadge } from './ui/Badge';
import styles from './TicketModal.module.css';

interface Props {
  ticket: Ticket | null;
  states: WorkflowState[];
  onClose: () => void;
  onSaved: () => void;
}

const TYPES: TicketType[]    = ['story', 'task', 'bug', 'epic'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

export default function TicketModal({ ticket, states, onClose, onSaved }: Props) {
  const isNew = !ticket;

  const [title, setTitle] = useState(ticket?.title ?? '');
  const [description, setDescription] = useState(ticket?.description ?? '');
  const [type, setType] = useState<TicketType>(ticket?.type ?? 'task');
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? 'medium');
  const [stateId, setStateId] = useState(ticket?.state_id ?? states[0]?.id ?? '');
  const [points, setPoints] = useState(String(ticket?.story_points ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title, description, type, priority, state_id: stateId,
        story_points: points ? Number(points) : undefined,
      };
      if (isNew) await ticketsApi.create(payload);
      else await ticketsApi.update(ticket.id, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  async function handleAiDraft() {
    if (!title.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const draft = await ticketsApi.aiDraft(title.trim());
      setDescription(draft.description);
      setType(draft.type);
      setPriority(draft.priority);
      setPoints(String(draft.story_points));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI draft failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDelete() {
    if (!ticket || !confirm('Delete this ticket?')) return;
    await ticketsApi.delete(ticket.id);
    onSaved();
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {!isNew && (
              <div className={styles.headerBadges}>
                <TypeBadge type={ticket.type} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            )}
            <h2 className={styles.title}>{isNew ? 'New ticket' : 'Edit ticket'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Title *</label>
              <button
                type="button"
                className={styles.aiBtn}
                onClick={handleAiDraft}
                disabled={!title.trim() || aiLoading}
                title="Draft description, type, priority and story points from the title"
              >
                <Sparkles size={12} className={aiLoading ? styles.aiSpin : undefined} />
                {aiLoading ? 'Drafting…' : 'AI Draft'}
              </button>
            </div>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short, specific description of the work"
              required
              autoFocus
            />
            {aiError && <p className={styles.error}>{aiError}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Acceptance criteria, context, links…"
              rows={4}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              <select className={styles.select} value={type} onChange={e => setType(e.target.value as TicketType)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.select} value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>State</label>
              <select className={styles.select} value={stateId} onChange={e => setStateId(e.target.value)}>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Story points</label>
              <input
                className={styles.input}
                type="number"
                min="0"
                max="100"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {!isNew && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <div className={styles.actionsRight}>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                {isNew ? 'Create ticket' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}