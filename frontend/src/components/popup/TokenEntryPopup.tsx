import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from './Popup';
import styles from './TokenEntryPopup.module.css';

interface TokenEntryPopupProps {
  onClose: () => void;
}

export function TokenEntryPopup({ onClose }: TokenEntryPopupProps) {
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  function handleSubmit() {
    const t = token.trim();
    if (!t) return;
    navigate(`/post-checkin/${t}`);
  }

  return (
    <Popup title="Einchecken" closable onClose={onClose}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="token">Meeting-Token</label>
        <input
          id="token"
          className={styles.input}
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="z.B. 48095ef1aa9e"
          autoFocus
        />
      </div>
      <button
        className={styles.button}
        onClick={handleSubmit}
        disabled={!token.trim()}
      >
        Zum Meeting
      </button>
    </Popup>
  );
}
