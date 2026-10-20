import { TicketPriority, TicketType } from '../../types';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant], styles[`size-${size}`]].join(' ')}>
      {children}
    </span>
  );
}

const PRIORITY_VARIANT: Record<TicketPriority, BadgeProps['variant']> = {
  critical: 'danger', high: 'warning', medium: 'accent', low: 'default',
};

const TYPE_VARIANT: Record<TicketType, BadgeProps['variant']> = {
  bug: 'danger', story: 'success', task: 'info', epic: 'accent',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]} size="sm">{priority}</Badge>;
}

export function TypeBadge({ type }: { type: TicketType }) {
  return <Badge variant={TYPE_VARIANT[type]} size="sm">{type}</Badge>;
}
