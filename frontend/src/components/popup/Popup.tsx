import { useEffect } from 'react';
import styles from './Popup.module.css';

interface PopupProps {
  title: string;
  closable?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Popup({ title, closable = false, onClose, children }: PopupProps) {
  useEffect(() => {
    if (!closable) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closable, onClose]);

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="popup-title">
        <div className={styles.header}>
          <h2 id="popup-title" className={styles.title}>{title}</h2>
          {closable && (
            <button className={styles.close} onClick={onClose} aria-label="Schließen">
              ×
            </button>
          )}
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
