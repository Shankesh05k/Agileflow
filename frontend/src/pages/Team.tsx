import { useEffect, useState } from 'react';
import { tickets as ticketsApi } from '../lib/api';
import { Ticket, UserRole } from '../types';
import styles from './Team.module.css';

interface Member { name: string; role: UserRole; tickets: number; completed: number; }

const DEMO_MEMBERS: Member[] = [
  { name: 'Alice Chen',   role: 'admin',     tickets: 0, completed: 0 },
  { name: 'Sam Torres',   role: 'developer', tickets: 0, completed: 0 },
  { name: 'Maya Patel',   role: 'developer', tickets: 0, completed: 0 },
  { name: 'Dan Kim',      role: 'viewer',    tickets: 0, completed: 0 },
];

const ROLE_COLOR: Record<UserRole, string> = {
  admin: 'var(--accent)',
  developer: 'var(--success)',
  viewer: 'var(--text-tertiary)',
};

export default function Team() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => { ticketsApi.list().then(setTickets); }, []);

  const members = DEMO_MEMBERS.map(m => ({
    ...m,
    tickets: tickets.filter(t => t.assignee_name === m.name).length,
    completed: tickets.filter(t => t.assignee_name === m.name && t.state_name?.toLowerCase().includes('done')).length,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Team</h1>
        <p className={styles.subtitle}>{members.length} members · AgileFlow workspace</p>
      </div>

      <div className={styles.rbacNotice}>
        <span className={styles.rbacTitle}>Role-based access control</span>
        <p className={styles.rbacDesc}>
          Permissions are enforced at the API level. Admins can manage sprints, delete tickets, and access audit logs.
          Developers can create and move tickets. Viewers have read-only access.
        </p>
      </div>

      <div className={styles.memberGrid}>
        {members.map(m => (
          <div key={m.name} className={styles.memberCard}>
            <div className={styles.memberAvatar}>{m.name.split(' ').map(n => n[0]).join('')}</div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{m.name}</span>
              <span className={styles.memberRole} style={{ color: ROLE_COLOR[m.role] }}>{m.role}</span>
            </div>
            <div className={styles.memberStats}>
              <div className={styles.memberStat}>
                <span className={styles.memberStatVal}>{m.tickets}</span>
                <span className={styles.memberStatKey}>assigned</span>
              </div>
              <div className={styles.memberStat}>
                <span className={styles.memberStatVal}>{m.completed}</span>
                <span className={styles.memberStatKey}>completed</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.permTable}>
        <h2 className={styles.permTitle}>Permission matrix</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Action</th>
              <th>Admin</th>
              <th>Developer</th>
              <th>Viewer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['View tickets',      true, true,  true],
              ['Create tickets',    true, true,  false],
              ['Move tickets',      true, true,  false],
              ['Delete tickets',    true, false, false],
              ['Manage sprints',    true, false, false],
              ['View audit log',    true, false, false],
              ['View analytics',    true, true,  true],
            ].map(([action, admin, dev, viewer]) => (
              <tr key={String(action)}>
                <td>{action}</td>
                <td><Tick allowed={admin as boolean} /></td>
                <td><Tick allowed={dev as boolean} /></td>
                <td><Tick allowed={viewer as boolean} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tick({ allowed }: { allowed: boolean }) {
  return (
    <span style={{
      color: allowed ? 'var(--success)' : 'var(--text-disabled)',
      fontWeight: 600,
      fontSize: '13px',
    }}>
      {allowed ? '✓' : '—'}
    </span>
  );
}
