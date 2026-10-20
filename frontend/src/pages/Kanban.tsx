import { useEffect, useState, useCallback } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { tickets as ticketsApi, workflow, sprints as sprintsApi } from '../lib/api';
import { Ticket, WorkflowState, Sprint } from '../types';
import { TypeBadge, PriorityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import TicketModal from '../components/TicketModal';
import styles from './Kanban.module.css';

function TicketCard({
  ticket,
  onDragStart,
  onClick,
}: {
  ticket: Ticket;
  onDragStart: (t: Ticket) => void;
  onClick: (t: Ticket) => void;
}) {
  return (
    <div
      className={styles.card}
      draggable
      onDragStart={() => onDragStart(ticket)}
      onClick={() => onClick(ticket)}
    >
      <div className={styles.cardMeta}>
        <TypeBadge type={ticket.type} />
        <PriorityBadge priority={ticket.priority} />
        {ticket.story_points != null && (
          <span className={styles.points}>{ticket.story_points}p</span>
        )}
      </div>

      <p className={styles.cardTitle}>{ticket.title}</p>

      <div className={styles.cardFooter}>
        {ticket.assignee_name ? (
          <span className={styles.assignee}>
            <span className={styles.assigneeAvatar}>
              {ticket.assignee_name[0]}
            </span>
            <span className={styles.assigneeName}>{ticket.assignee_name.split(' ')[0]}</span>
          </span>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        )}
        <button className={styles.cardMenu} onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  );
}

export default function Kanban() {
  const [ticketsByState, setTicketsByState] = useState<Record<string, Ticket[]>>({});
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<string>('');
  const [dragging, setDragging] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [st, sp, t] = await Promise.all([
      workflow.states(),
      sprintsApi.list(),
      ticketsApi.list(activeSprint ? { sprint_id: activeSprint } : {}),
    ]);
    setStates(st);
    setSprints(sp);
    const grouped: Record<string, Ticket[]> = {};
    st.forEach(s => { grouped[s.id] = []; });
    t.forEach(ticket => {
      if (grouped[ticket.state_id]) grouped[ticket.state_id].push(ticket);
      else grouped[ticket.state_id] = [ticket];
    });
    setTicketsByState(grouped);
    setLoading(false);
  }, [activeSprint]);

  useEffect(() => { load(); }, [load]);

  async function handleDrop(stateId: string) {
    if (!dragging || dragging.state_id === stateId) return;
    try {
      await ticketsApi.move(dragging.id, stateId);
      await load();
    } catch (e) {
      console.error(e);
    }
    setDragging(null);
  }

  if (loading) return <div className={styles.loading}>Loading board…</div>;

  const activeSprintData = sprints.find(s => s.status === 'active');

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.title}>Board</h1>
          {activeSprintData && (
            <span className={styles.sprintBadge}>{activeSprintData.name}</span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <select
            className={styles.select}
            value={activeSprint}
            onChange={e => setActiveSprint(e.target.value)}
          >
            <option value="">All sprints</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={13} /> New ticket
          </Button>
        </div>
      </div>

      <div className={styles.board}>
        {states.map(state => {
          const cols = ticketsByState[state.id] ?? [];
          return (
            <div
              key={state.id}
              className={styles.column}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(state.id)}
            >
              <div className={styles.colHeader}>
                <div className={styles.colTitle}>
                  <span
                    className={styles.colDot}
                    style={{ background: state.color || 'var(--text-tertiary)' }}
                  />
                  <span>{state.name}</span>
                </div>
                <span className={styles.colCount}>{cols.length}</span>
              </div>

              <div className={styles.colBody}>
                {cols.map(t => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    onDragStart={setDragging}
                    onClick={setSelectedTicket}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(selectedTicket || showCreate) && (
        <TicketModal
          ticket={selectedTicket}
          states={states}
          onClose={() => { setSelectedTicket(null); setShowCreate(false); }}
          onSaved={() => { load(); setSelectedTicket(null); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
