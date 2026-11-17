import { useCallback } from 'react';
import * as adminService from '../services/adminService';
import type { UserProfile } from '../types';
import type { RoleName } from '../utils/roles';
import { usePaginatedList } from './usePaginatedList';

export function useAdminUsers() {
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) => adminService.getUsers(page, size, signal),
    []
  );
  const list = usePaginatedList<UserProfile>(fetchPage, 20);
  const { setItems } = list;

  const changeRole = useCallback(
    async (userId: number, role: RoleName) => {
      const updated = await adminService.updateUserRole(userId, role);
      setItems((previous) => previous.map((user) => (user.id === userId ? updated : user)));
      return updated;
    },
    [setItems]
  );

  const replaceUser = useCallback(
    (updated: UserProfile) =>
      setItems((previous) => previous.map((user) => (user.id === updated.id ? updated : user))),
    [setItems]
  );

  const banUser = useCallback(
    async (userId: number, reason: string, days: number | null) => {
      const updated = await adminService.banUser(userId, reason, days);
      replaceUser(updated);
      return updated;
    },
    [replaceUser]
  );

  const unbanUser = useCallback(
    async (userId: number) => {
      const updated = await adminService.unbanUser(userId);
      replaceUser(updated);
      return updated;
    },
    [replaceUser]
  );

  return { ...list, users: list.items, changeRole, banUser, unbanUser };
}
