import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={[styles.btn, styles[variant], styles[`size-${size}`], className].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
