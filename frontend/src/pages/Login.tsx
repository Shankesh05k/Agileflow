import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('alice@agileflow.dev');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Activity size={22} color="var(--accent)" strokeWidth={2.5} />
          <span className={styles.logoText}>AgileFlow</span>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Sign in to your workspace</h1>
          <p className={styles.subtitle}>Agile project management for engineering teams</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
            Sign in
          </Button>
        </form>

        <div className={styles.demoUsers}>
          <p className={styles.demoTitle}>Demo accounts</p>
          <div className={styles.demoGrid}>
            {[
              { label: 'Admin', email: 'alice@agileflow.dev' },
              { label: 'Developer', email: 'sam@agileflow.dev' },
              { label: 'Viewer', email: 'dan@agileflow.dev' },
            ].map(({ label, email: e }) => (
              <button
                key={e}
                type="button"
                className={styles.demoBtn}
                onClick={() => { setEmail(e); setPassword('password'); }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
