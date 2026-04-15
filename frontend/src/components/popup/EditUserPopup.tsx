import { useState } from 'react';
import { Popup } from './Popup';
import { UsersService } from '../../api';
import styles from './EditUserPopup.module.css';

interface User {
  id: string;
  rzId: string;
  firstName: string;
  lastName: string;
}

interface EditUserPopupProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserPopup({ user, onClose, onSaved }: EditUserPopupProps) {
  const [rzId, setRzId]           = useState(user.rzId);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName]   = useState(user.lastName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  async function handleSave() {
    setSubmitting(true);
    setError('');
    try {
      await UsersService.usersControllerUpdate(user.id, {
        rzId: rzId.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      onSaved();
    } catch {
      setError('Fehler beim Speichern.');
      setSubmitting(false);
    }
  }

  return (
    <Popup title="Benutzer bearbeiten" closable onClose={onClose}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="rzId">RZ-ID</label>
        <input id="rzId" className={styles.input} type="text"
          value={rzId}
          onChange={e => setRzId(e.target.value.toLowerCase())}
          onBlur={e => setRzId(e.target.value.trim().toLowerCase())}
          disabled={submitting} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="firstName">Vorname</label>
        <input id="firstName" className={styles.input} type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          onBlur={e => setFirstName(e.target.value.trim())}
          disabled={submitting} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lastName">Nachname</label>
        <input id="lastName" className={styles.input} type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          onBlur={e => setLastName(e.target.value.trim())}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          disabled={submitting} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button className={styles.buttonSecondary} onClick={onClose} disabled={submitting}>
          Abbrechen
        </button>
        <button className={styles.button} onClick={handleSave}
          disabled={submitting || !rzId.trim() || !firstName.trim() || !lastName.trim()}>
          {submitting ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
    </Popup>
  );
}
