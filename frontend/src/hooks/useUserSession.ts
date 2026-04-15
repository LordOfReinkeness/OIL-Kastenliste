import { use } from 'react';
import { UserSessionContext } from '../context/UserSessionContext';

export function useUserSession() {
  return use(UserSessionContext);
}
