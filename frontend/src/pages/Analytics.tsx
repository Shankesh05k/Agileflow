import { useEffect, useRef, useState } from 'react';
import { sprints as sprintsApi } from '../lib/api';
import { VelocityData } from '../types';
import styles from './Analytics.module.css';

function VelocityChart({ data }: { data: VelocityData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio ?? 1;

    const W = canvas.offsetWidth;
    const H = 220;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Colors from CSS variables
    const accent = '#5B5BD6';
    const success = '#30A46C';
    const border = '#2A2A2E';
    const textTertiary = '#6B6B74';
    const surface = '#1C1C1F';

    ctx.clearRect(0, 0, W, H);

    const PAD = { top: 16, right: 20, bottom: 40, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...data.flatMap(d => [d.planned_points, d.completed_points]), 1);
    const yStep = Math.ceil(maxVal / 4);

    // Grid lines
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = textTertiary;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(i * yStep), PAD.left - 6, y + 4);
    }

    const BAR_W = Math.min(32, (chartW / data.length) * 0.35);
    const GROUP_W = chartW / data.length;

    data.forEach((d, i) => {
      const x = PAD.left + i * GROUP_W + GROUP_W / 2;

      // Planned bar
      const plannedH = (d.planned_points / maxVal) * chartH;
      ctx.fillStyle = surface;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      const px = x - BAR_W - 2;
      ctx.beginPath();
      ctx.roundRect(px, PAD.top + chartH - plannedH, BAR_W, plannedH, [3, 3, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Completed bar
      const completedH = (d.completed_points / maxVal) * chartH;
      ctx.fillStyle = success;
      ctx.strokeStyle = 'transparent';
      const cx2 = x + 2;
      ctx.beginPath();
      ctx.roundRect(cx2, PAD.top + chartH - completedH, BAR_W, completedH, [3, 3, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = textTertiary;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.sprint_name.replace('Sprint ', 'S'), x, H - 8);
    });
  }, [data]);

  return (
    <div className={styles.chartWrap}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--bg-elevated)', outline: '1.5px solid var(--accent)' }} />
          Planned
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--success)' }} />
          Completed
        </span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [velocity, setVelocity] = useState<VelocityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sprintsApi.velocity().then(v => { setVelocity(v); setLoading(false); });
  }, []);

  const avgCompleted = velocity.length
    ? Math.round(velocity.reduce((sum, d) => sum + d.completed_points, 0) / velocity.length)
    : 0;

  const avgPlanned = velocity.length
    ? Math.round(velocity.reduce((sum, d) => sum + d.planned_points, 0) / velocity.length)
    : 0;

  const predictability = avgPlanned ? Math.round((avgCompleted / avgPlanned) * 100) : 0;

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Sprint performance over time</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Avg velocity</span>
          <span className={styles.statVal}>{avgCompleted} <span className={styles.statUnit}>pts/sprint</span></span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Avg planned</span>
          <span className={styles.statVal}>{avgPlanned} <span className={styles.statUnit}>pts/sprint</span></span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Predictability</span>
          <span className={styles.statVal}>{predictability}<span className={styles.statUnit}>%</span></span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sprints tracked</span>
          <span className={styles.statVal}>{velocity.length}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Velocity</h2>
        <p className={styles.cardSubtitle}>Story points planned vs completed per sprint</p>
        {velocity.length === 0 ? (
          <p className={styles.empty}>No completed sprints yet</p>
        ) : (
          <VelocityChart data={velocity} />
        )}
      </div>

      {velocity.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Sprint breakdown</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sprint</th>
                <th>Planned</th>
                <th>Completed</th>
                <th>Completion rate</th>
              </tr>
            </thead>
            <tbody>
              {velocity.map(d => (
                <tr key={d.sprint_name}>
                  <td>{d.sprint_name}</td>
                  <td>{d.planned_points}</td>
                  <td>{d.completed_points}</td>
                  <td>
                    <div className={styles.rateCell}>
                      <div className={styles.rateBar}>
                        <div
                          className={styles.rateFill}
                          style={{ width: `${d.planned_points ? Math.round((d.completed_points / d.planned_points) * 100) : 0}%` }}
                        />
                      </div>
                      <span>{d.planned_points ? Math.round((d.completed_points / d.planned_points) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
