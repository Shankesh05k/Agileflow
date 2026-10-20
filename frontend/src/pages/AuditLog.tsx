import { useEffect, useState } from 'react';
import { audit as auditApi } from '../lib/api';
import { AuditLog as AuditEntry } from '../types';
import { useAuthStore } from '../store/auth';
import styles from './AuditLog.module.css';

const ACTION_COLOR: Record<string, string> = {
  created: 'var(--success)',
  updated: 'var(--info)',
  deleted: 'var(--danger)',
  status_changed: 'var(--warning)',
  sprint_started: 'var(--accent)',
  sprint_completed: 'var(--success)',
};

export default function AuditLog() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { setLoading(false); return; }
    auditApi.list(100).then(e => { setEntries(e); setLoading(false); });
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Audit Log</h1>
        <div className={styles.forbidden}>
          This page is visible to admins only.
        </div>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Audit Log</h1>
        <p className={styles.subtitle}>{entries.length} events recorded</p>
      </div>

      <div className={styles.timeline}>
        {entries.map(e => (
          <div key={e.id} className={styles.entry}>
            <div className={styles.entryLeft}>
              <div className={styles.avatar}>{e.actor_name?.[0] ?? '?'}</div>
              <div className={styles.line} />
            </div>
            <div className={styles.entryBody}>
              <div className={styles.entryHeader}>
                <span className={styles.actorName}>{e.actor_name}</span>
                <span
                  className={styles.action}
                  style={{ color: ACTION_COLOR[e.action] ?? 'var(--text-secondary)' }}
                >
                  {e.action.replace('_', ' ')}
                </span>
                <span className={styles.entityType}>{e.entity_type}</span>
              </div>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre className={styles.payload}>
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              )}
              <span className={styles.timestamp}>
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className={styles.empty}>No audit events yet.</p>
        )}
      </div>
    </div>
  );
}
