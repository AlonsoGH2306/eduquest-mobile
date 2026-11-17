import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { Group } from '../types';
import { normalizeGroupCode } from '../utils/groupQr';
import { getErrorMessage, getErrorStatus, isCanceled } from '../utils/errors';

export function useGroupInvite(rawCode: string) {
  const code = normalizeGroupCode(rawCode);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    groupService
      .getGroupByCode(code, controller.signal)
      .then(setGroup)
      .catch((err) => {
        if (isCanceled(err)) return;
        setError(
          getErrorStatus(err) === 404
            ? `El enlace no corresponde a ningún grupo (código ${code}). Puede que lo hayan eliminado.`
            : getErrorMessage(err)
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [code, reloadKey]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return { code, group, loading, error, retry };
}
