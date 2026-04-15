import { Popup } from './Popup';
import styles from './ConfirmPopup.module.css';

interface ConfirmPopupProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}

export function ConfirmPopup({
  title, message, confirmLabel = 'Bestätigen', onConfirm, onClose, busy = false,
}: ConfirmPopupProps) {
  return (
    <Popup title={title} closable onClose={onClose}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button className={styles.buttonSecondary} onClick={onClose} disabled={busy}>
          Abbrechen
        </button>
        <button className={styles.buttonDanger} onClick={onConfirm} disabled={busy}>
          {busy ? '…' : confirmLabel}
        </button>
      </div>
    </Popup>
  );
}
