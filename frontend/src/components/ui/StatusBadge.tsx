import styles from './StatusBadge.module.css';

type Infraction = 'none' | 'late' | 'absent' | 'pending';

interface StatusBadgeProps {
  infraction: Infraction;
}

const config: Record<Infraction, { label: string; className: string }> = {
  none:    { label: '✓', className: 'present' },
  late:    { label: '!', className: 'late'    },
  absent:  { label: '✗', className: 'absent'  },
  pending: { label: '—', className: 'pending' },
};

export function StatusBadge({ infraction }: StatusBadgeProps) {
  const { label, className } = config[infraction] ?? config.pending;
  return <span className={`${styles.badge} ${styles[className]}`}>{label}</span>;
}
