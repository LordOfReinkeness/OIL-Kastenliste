import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPopup } from './popup/LoginPopup';

export function RequireAuth() {
  const { isAdmin } = useAuth();

  if (isAdmin === null) return null;
  if (!isAdmin) return <LoginPopup />;
  return <Outlet />;
}
