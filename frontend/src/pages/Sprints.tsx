import { useEffect, useState } from 'react';
import { Plus, Play, CheckCheck, Calendar } from 'lucide-react';
import { sprints as sprintsApi } from '../lib/api';
import { Sprint } from '../types';
import { Button } from '../components/ui/Button';
import styles from './Sprints.module.css';

function SprintStatusDot({ status }: { status: Sprint['status'] }) {
  const colors = { active: 'var(--success)', planned: 'var(--info)', completed: 'var(--text-tertiary)' };
  return <span className={styles.statusDot} style={{ background: colors[status] }} />;
}

export default function Sprints() {
  const [sprintList, setSprintList] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () =>
    sprintsApi.list().then(s => { setSprintList(s); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function handleStart(id: string) {
    await sprintsApi.start(id);
    load();
  }

  async function handleComplete(id: string) {
    await sprintsApi.complete(id);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await sprintsApi.create(form);
    setSaving(false);
    setShowCreate(false);
    setForm({ name: '', goal: '', start_date: '', end_date: '' });
    load();
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  const active = sprintList.find(s => s.status === 'active');
  const planned = sprintList.filter(s => s.status === 'planned');
  const completed = sprintList.filter(s => s.status === 'completed');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sprints</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(v => !v)}>
          <Plus size={13} /> New sprint
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <h2 className={styles.formTitle}>Create sprint</h2>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Name *</label>
              <input className={styles.input} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Sprint 4" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Start *</label>
              <input className={styles.input} type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End *</label>
              <input className={styles.input} type="date" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Sprint goal</label>
            <input className={styles.input} value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              placeholder="What should this sprint achieve?" />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>Create</Button>
          </div>
        </form>
      )}

      {/* Active */}
      {active && (
        <section>
          <h2 className={styles.sectionTitle}>Active</h2>
          <SprintCard sprint={active} onComplete={() => handleComplete(active.id)} />
        </section>
      )}

      {/* Planned */}
      {planned.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Planned</h2>
          <div className={styles.grid}>
            {planned.map(s => (
              <SprintCard key={s.id} sprint={s}
                onStart={!active ? () => handleStart(s.id) : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Completed</h2>
          <div className={styles.grid}>
            {completed.map(s => <SprintCard key={s.id} sprint={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SprintCard({ sprint, onStart, onComplete }: {
  sprint: Sprint;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const progress = Math.round((sprint.completed_points / Math.max(sprint.total_points, 1)) * 100);

  return (
    <div className={[styles.sprintCard, sprint.status === 'active' ? styles.active : ''].join(' ')}>
      <div className={styles.sprintCardHeader}>
        <div className={styles.sprintCardTitle}>
          <SprintStatusDot status={sprint.status} />
          <span>{sprint.name}</span>
        </div>
        <span className={styles.sprintStatus}>{sprint.status}</span>
      </div>

      {sprint.goal && <p className={styles.sprintGoal}>{sprint.goal}</p>}

      <div className={styles.sprintDates}>
        <Calendar size={11} />
        {new Date(sprint.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        {' — '}
        {new Date(sprint.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </div>

      <div className={styles.sprintStats}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{sprint.total_tickets}</span>
          <span className={styles.statKey}>tickets</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{sprint.completed_tickets}</span>
          <span className={styles.statKey}>done</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{sprint.total_points}</span>
          <span className={styles.statKey}>points</span>
        </div>
      </div>

      {sprint.status !== 'completed' && (
        <>
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
        </>
      )}

      {(onStart || onComplete) && (
        <div className={styles.sprintActions}>
          {onStart && (
            <Button variant="primary" size="sm" onClick={onStart}>
              <Play size={11} /> Start sprint
            </Button>
          )}
          {onComplete && (
            <Button variant="secondary" size="sm" onClick={onComplete}>
              <CheckCheck size={11} /> Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
