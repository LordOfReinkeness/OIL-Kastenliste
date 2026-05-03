import { useState } from 'react';
import styles from './DurationField.module.css';

interface Props {
  label: string;
  days: number;
  hours: number;
  minutes: number;
  onChange: (days: number, hours: number, minutes: number) => void;
  direction: 'before' | 'after';
  reference?: Date;
  info?: string;
  disabled?: boolean;
}

function formatPreview(d: Date) {
  return d.toLocaleString('de-DE', {
    weekday: 'short',
    day:     '2-digit',
    month:   '2-digit',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  }) + ' Uhr';
}

function computePreview(ref: Date, days: number, hours: number, minutes: number, direction: 'before' | 'after'): Date {
  const ms = (days * 1440 + hours * 60 + minutes) * 60_000;
  return new Date(direction === 'after' ? ref.getTime() + ms : ref.getTime() - ms);
}

export function DurationField({ label, days, hours, minutes, onChange, direction, reference, info, disabled }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);

  const preview = reference
    ? computePreview(reference, days, hours, minutes, direction)
    : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {info && (
          <button
            type="button"
            className={styles.infoBtn}
            title={info}
            onClick={() => setInfoOpen(o => !o)}
            aria-label="Info"
          >
            ⓘ
          </button>
        )}
      </div>

      {info && infoOpen && (
        <p className={styles.infoText}>{info}</p>
      )}

      <div className={styles.spinners}>
        <div className={styles.spinnerField}>
          <input
            className={styles.input}
            type="number"
            min="0"
            value={days}
            onChange={e => onChange(Number(e.target.value), hours, minutes)}
            disabled={disabled}
          />
          <span className={styles.unit}>Tage</span>
        </div>
        <div className={styles.spinnerField}>
          <input
            className={styles.input}
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={e => onChange(days, Number(e.target.value), minutes)}
            disabled={disabled}
          />
          <span className={styles.unit}>Std</span>
        </div>
        <div className={styles.spinnerField}>
          <input
            className={styles.input}
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={e => onChange(days, hours, Number(e.target.value))}
            disabled={disabled}
          />
          <span className={styles.unit}>Min</span>
        </div>
      </div>

      {preview && (
        <p className={styles.preview}>→ {formatPreview(preview)}</p>
      )}
    </div>
  );
}
