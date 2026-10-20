import { useEffect, useState } from 'react';
import { CircleCheckBig, CircleX, Clock, RefreshCw, GitBranch, GitCommit } from 'lucide-react';
import styles from './CIPipeline.module.css';

// Simulated pipeline data (in production these come from the DB / GitHub API)
interface Stage { name: string; status: 'success' | 'failed' | 'running' | 'pending'; duration?: string; }
interface Run {
  id: string;
  branch: string;
  commit: string;
  author: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  trigger: string;
  createdAt: string;
  stages: Stage[];
}

const MOCK_RUNS: Run[] = [
  {
    id: 'run-001', branch: 'main', commit: '7f3a9bc',
    author: 'Alice Chen', status: 'success',
    trigger: 'push', createdAt: '2024-11-15T09:14:00Z',
    stages: [
      { name: 'Lint', status: 'success', duration: '22s' },
      { name: 'Unit tests', status: 'success', duration: '1m 48s' },
      { name: 'Coverage gate', status: 'success', duration: '8s' },
      { name: 'Build', status: 'success', duration: '2m 11s' },
      { name: 'Deploy', status: 'success', duration: '55s' },
    ],
  },
  {
    id: 'run-002', branch: 'feat/ticket-drag', commit: 'c912d50',
    author: 'Sam Torres', status: 'failed',
    trigger: 'pull_request', createdAt: '2024-11-15T08:02:00Z',
    stages: [
      { name: 'Lint', status: 'success', duration: '21s' },
      { name: 'Unit tests', status: 'failed', duration: '2m 04s' },
      { name: 'Coverage gate', status: 'pending' },
      { name: 'Build', status: 'pending' },
      { name: 'Deploy', status: 'pending' },
    ],
  },
  {
    id: 'run-003', branch: 'feat/analytics', commit: 'a44b821',
    author: 'Maya Patel', status: 'running',
    trigger: 'pull_request', createdAt: '2024-11-15T10:31:00Z',
    stages: [
      { name: 'Lint', status: 'success', duration: '19s' },
      { name: 'Unit tests', status: 'success', duration: '1m 52s' },
      { name: 'Coverage gate', status: 'running' },
      { name: 'Build', status: 'pending' },
      { name: 'Deploy', status: 'pending' },
    ],
  },
];

function StatusIcon({ status }: { status: Run['status'] }) {
  if (status === 'success') return <CircleCheckBig size={14} color="var(--success)" />;
  if (status === 'failed')  return <CircleX       size={14} color="var(--danger)" />;
  if (status === 'running') return <RefreshCw    size={14} color="var(--info)" className={styles.spin} />;
  return <Clock size={14} color="var(--text-tertiary)" />;
}

function StageChip({ stage }: { stage: Stage }) {
  const bg = {
    success: 'var(--success-muted)', failed: 'var(--danger-muted)',
    running: 'var(--info-muted)', pending: 'var(--bg-active)',
  }[stage.status];
  const color = {
    success: 'var(--success)', failed: 'var(--danger)',
    running: 'var(--info)', pending: 'var(--text-tertiary)',
  }[stage.status];

  return (
    <div className={styles.stageChip} style={{ background: bg }}>
      <StatusIcon status={stage.status} />
      <span style={{ color }} className={styles.stageName}>{stage.name}</span>
      {stage.duration && <span className={styles.stageDur}>{stage.duration}</span>}
    </div>
  );
}

export default function CIPipeline() {
  const [selected, setSelected] = useState<string | null>(MOCK_RUNS[0].id);
  const [runs] = useState<Run[]>(MOCK_RUNS);

  const run = runs.find(r => r.id === selected);
  const successRate = Math.round((runs.filter(r => r.status === 'success').length / runs.length) * 100);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>CI / CD</h1>
        <p className={styles.subtitle}>GitHub Actions pipeline status</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Success rate</span>
          <span className={styles.statVal}>{successRate}<span className={styles.statUnit}>%</span></span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total runs</span>
          <span className={styles.statVal}>{runs.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Passing</span>
          <span className={styles.statVal} style={{ color: 'var(--success)' }}>
            {runs.filter(r => r.status === 'success').length}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Failed</span>
          <span className={styles.statVal} style={{ color: 'var(--danger)' }}>
            {runs.filter(r => r.status === 'failed').length}
          </span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Run list */}
        <div className={styles.runList}>
          {runs.map(r => (
            <div
              key={r.id}
              className={[styles.runRow, selected === r.id ? styles.runRowActive : ''].join(' ')}
              onClick={() => setSelected(r.id)}
            >
              <StatusIcon status={r.status} />
              <div className={styles.runInfo}>
                <div className={styles.runBranch}>
                  <GitBranch size={10} color="var(--text-tertiary)" />
                  <span>{r.branch}</span>
                </div>
                <span className={styles.runCommit}>
                  <GitCommit size={10} color="var(--text-tertiary)" /> {r.commit}
                </span>
              </div>
              <div className={styles.runMeta}>
                <span className={styles.runAuthor}>{r.author.split(' ')[0]}</span>
                <span className={styles.runTrigger}>{r.trigger}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {run && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>
                <StatusIcon status={run.status} />
                <span>#{run.id.replace('run-', '')}</span>
                <span className={styles.detailBranch}>
                  <GitBranch size={12} /> {run.branch}
                </span>
              </div>
              <span className={styles.detailTime}>
                {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className={styles.stages}>
              {run.stages.map(s => <StageChip key={s.name} stage={s} />)}
            </div>

            <div className={styles.detailMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Author</span>
                <span className={styles.metaVal}>{run.author}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Commit</span>
                <span className={styles.metaVal} style={{ fontFamily: 'var(--font-mono)' }}>{run.commit}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Trigger</span>
                <span className={styles.metaVal}>{run.trigger}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Status</span>
                <span className={styles.metaVal} style={{
                  color: run.status === 'success' ? 'var(--success)' :
                    run.status === 'failed' ? 'var(--danger)' : 'var(--info)'
                }}>{run.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
