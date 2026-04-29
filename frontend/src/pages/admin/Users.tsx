import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminStatsService, UsersService } from '../../api';
import { EditUserPopup } from '../../components/popup/EditUserPopup';
import { ConfirmPopup } from '../../components/popup/ConfirmPopup';
import styles from './Users.module.css';

interface UserRow {
  id: string;
  rzId: string;
  firstName: string;
  lastName: string;
  stats: {
    totalMeetings: number;
    absent: number;
    late: number;
    infractions: number;
  };
}

export function AdminUsers() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    AdminStatsService.adminStatsControllerGetStats()
      .then(data => {
        const sorted = [...data].sort((a: UserRow, b: UserRow) =>
          a.lastName.localeCompare(b.lastName)
        );
        setUsers(sorted);
      })
      .catch(() => setError('Fehler beim Laden der Benutzer.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await UsersService.usersControllerRemove(deleteUser.id);
      setDeleteUser(null);
      load();
    } catch {
      setDeleting(false);
    }
  }

  if (loading) return <p className={styles.muted}>Wird geladen…</p>;
  if (error)   return <p className={styles.muted}>{error}</p>;
  if (!users.length) return <p className={styles.muted}>Keine Benutzer vorhanden.</p>;

  return (
    <div className={styles.page}>
      <ul className={styles.list}>
        {users.map(user => (
          <li key={user.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.name}>{user.lastName}, {user.firstName}</span>
              <span className={styles.rzId}>{user.rzId}</span>
              <span className={styles.stats}>
                {user.stats.totalMeetings} Meetings
                · {user.stats.absent} fehlend
                · {user.stats.late} verspätet
                · <strong>{user.stats.infractions} Strafstriche</strong>
              </span>
            </div>
            <div className={styles.actions}>
              <button className={styles.editButton} onClick={() => setEditUser(user)}>
                Bearbeiten
              </button>
              <button className={styles.deleteButton} onClick={() => setDeleteUser(user)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editUser && (
        <EditUserPopup
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); load(); }}
        />
      )}

      {deleteUser && (
        <ConfirmPopup
          title="Benutzer löschen"
          message={`${deleteUser.lastName}, ${deleteUser.firstName} (${deleteUser.rzId}) wirklich löschen?`}
          confirmLabel="Löschen"
          onConfirm={handleDelete}
          onClose={() => { setDeleteUser(null); setDeleting(false); }}
          busy={deleting}
        />
      )}
    </div>
  );
}
