import { useCallback, useState } from 'react';
import { joinGroup } from '../services/groupService';
import type { Group } from '../types';
import { useToast } from './useContexts';
import { getErrorMessage, getErrorStatus } from '../utils/errors';

export type JoinOutcome = 'joined' | 'password' | 'failed';

export function useGroupJoin(onJoined: (group: Group) => void, onCancel?: () => void) {
  const { showToast } = useToast();
  const [target, setTarget] = useState<Group | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const close = useCallback(() => {
    setTarget(null);
    setPassword('');
    setError(null);
  }, []);

  const attempt = useCallback(
    async (group: Group, secret?: string, inviteToken?: string): Promise<boolean> => {
      setJoiningId(group.id);
      try {
        const joined = await joinGroup(group.id, secret, inviteToken);
        showToast(`Te uniste a ${joined.name}`, 'success');
        close();
        onJoined(joined);
        return true;
      } catch (err) {
        const status = getErrorStatus(err);
        if (status === 409) {
          showToast('Ya eras miembro de este grupo.', 'info');
          close();
          onJoined({ ...group, member: true });
          return true;
        }
        if (status === 403 && secret !== undefined) {
          setError('Esa no es la contraseña. Revísala e inténtalo otra vez.');
          return false;
        }
        if (status === 403 && inviteToken) {
          setPassword('');
          setError('La invitación venció. Escribe la contraseña del grupo o pide un enlace nuevo.');
          setTarget(group);
          return false;
        }
        showToast(status === 404 ? 'Ese grupo ya no existe.' : getErrorMessage(err), 'error');
        return false;
      } finally {
        setJoiningId(null);
      }
    },
    [close, onJoined, showToast]
  );

  const start = useCallback(
    async (group: Group, inviteToken?: string): Promise<JoinOutcome> => {
      if (group.member) {
        onJoined(group);
        return 'joined';
      }
      if (group.visibility === 'PRIVATE' && inviteToken) {
        return (await attempt(group, undefined, inviteToken)) ? 'joined' : 'password';
      }
      if (group.visibility === 'PRIVATE') {
        setPassword('');
        setError(null);
        setTarget(group);
        return 'password';
      }
      return (await attempt(group)) ? 'joined' : 'failed';
    },
    [attempt, onJoined]
  );

  const submit = useCallback(() => {
    if (target && password && joiningId === null) attempt(target, password);
  }, [attempt, joiningId, password, target]);

  const dismiss = useCallback(() => {
    close();
    onCancel?.();
  }, [close, onCancel]);

  const changePassword = useCallback((value: string) => {
    setPassword(value);
    setError(null);
  }, []);

  return {
    start,
    joiningId,
    dialog: {
      visible: target !== null,
      groupName: target?.name ?? '',
      password,
      error,
      joining: target !== null && joiningId === target.id,
      onChangePassword: changePassword,
      onSubmit: submit,
      onDismiss: dismiss,
    },
  };
}
