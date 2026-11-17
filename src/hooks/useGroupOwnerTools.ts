import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { GroupInvite } from '../types';
import { getErrorMessage } from '../utils/errors';

export function useGroupOwnerTools(groupId: number, enabled: boolean) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvite = useCallback(
    async (regenerate: boolean): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        setInvite(await groupService.createInvite(groupId, regenerate));
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    if (enabled && !invite) loadInvite(false);
  }, [enabled, invite, loadInvite]);

  const regenerate = useCallback(() => loadInvite(true), [loadInvite]);

  const changePassword = useCallback(
    (password: string) => groupService.changeGroupPassword(groupId, password),
    [groupId]
  );

  return { invite, loading, error, regenerate, changePassword };
}
