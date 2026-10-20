import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Zap, BarChart2,
  Users, GitPullRequest, ScrollText, LogOut,
  ChevronRight, Activity
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import styles from './Layout.module.css';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/board',      label: 'Board',       icon: Kanban },
  { to: '/sprints',    label: 'Sprints',     icon: Zap },
  { to: '/analytics',  label: 'Analytics',   icon: BarChart2 },
  { to: '/team',       label: 'Team',        icon: Users },
  { to: '/pipeline',   label: 'CI / CD',     icon: GitPullRequest },
  { to: '/audit',      label: 'Audit Log',   icon: ScrollText },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const pageTitle = NAV.find(n => location.pathname.startsWith(n.to))?.label ?? 'AgileFlow';

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Activity size={18} color="var(--accent)" strokeWidth={2.5} />
          <span className={styles.brandName}>AgileFlow</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
            }>
              <Icon size={15} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{user?.name?.[0] ?? '?'}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbRoot}>AgileFlow</span>
            <ChevronRight size={12} color="var(--text-tertiary)" />
            <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
