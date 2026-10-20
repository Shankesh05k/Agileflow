import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, CircleCheckBig, CircleAlert, Zap, ArrowRight } from 'lucide-react';
import { tickets as ticketsApi, sprints as sprintsApi, workflow } from '../lib/api';
import { Ticket, Sprint, WorkflowState } from '../types';
import { useAuthStore } from '../store/auth';
import { TypeBadge, PriorityBadge } from '../components/ui/Badge';
import styles from './Dashboard.module.css';

interface StatCard { label: string; value: string | number; icon: React.ReactNode; trend?: string; }

function StatCard({ label, value, icon, trend }: StatCard) {
  return (
    <div className={styles.stat}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      {trend && <div className={styles.statTrend}>{trend}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ticketsApi.list(),
      sprintsApi.list(),
      workflow.states(),
    ]).then(([t, s, st]) => {
      setAllTickets(t);
      setActiveSprint(s.find(sp => sp.status === 'active') ?? null);
      setStates(st);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const myTickets = allTickets.filter(t => t.assignee_id === user?.id);
  const doneState = states.find(s => s.name.toLowerCase().includes('done'));
  const inProgressState = states.find(s => s.name.toLowerCase().includes('progress'));

  const completedCount = doneState ? allTickets.filter(t => t.state_id === doneState.id).length : 0;
  const inProgressCount = inProgressState ? allTickets.filter(t => t.state_id === inProgressState.id).length : 0;
  const blockedCount = allTickets.filter(t => t.priority === 'critical').length;

  if (loading) return <div className={styles.loading}>Loading…</div>;

  const sprintProgress = activeSprint
    ? Math.round((activeSprint.completed_points / Math.max(activeSprint.total_points, 1)) * 100)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Good to see you, {user?.name?.split(' ')[0]}.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Tickets"
          value={allTickets.length}
          icon={<TicketIcon size={14} />}
          trend={`${myTickets.length} assigned to you`}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={<CircleCheckBig size={14} color="var(--success)" />}
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Zap size={14} color="var(--info)" />}
        />
        <StatCard
          label="Critical"
          value={blockedCount}
          icon={<CircleAlert size={14} color="var(--danger)" />}
        />
      </div>

      <div className={styles.grid}>
        {/* Active Sprint */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Active Sprint</h2>
            <Link to="/sprints" className={styles.cardLink}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {activeSprint ? (
            <div className={styles.sprintContent}>
              <div className={styles.sprintName}>{activeSprint.name}</div>
              {activeSprint.goal && (
                <p className={styles.sprintGoal}>{activeSprint.goal}</p>
              )}
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>
                  {activeSprint.completed_points} / {activeSprint.total_points} pts
                </span>
                <span className={styles.progressPct}>{sprintProgress}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${sprintProgress}%` }}
                />
              </div>
              <div className={styles.sprintMeta}>
                <span>{activeSprint.completed_tickets} of {activeSprint.total_tickets} tickets done</span>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>No active sprint</p>
          )}
        </div>

        {/* My Tickets */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>My Tickets</h2>
            <Link to="/board" className={styles.cardLink}>
              View board <ArrowRight size={12} />
            </Link>
          </div>
          <div className={styles.ticketList}>
            {myTickets.length === 0 ? (
              <p className={styles.empty}>No tickets assigned to you</p>
            ) : myTickets.slice(0, 6).map(t => (
              <div key={t.id} className={styles.ticketRow}>
                <div className={styles.ticketMeta}>
                  <TypeBadge type={t.type} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <span className={styles.ticketTitle}>{t.title}</span>
                <span className={styles.ticketState} style={{ color: t.state_color }}>
                  {t.state_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
