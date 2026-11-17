import { useCallback, useState } from 'react';
import * as groupService from '../services/groupService';
import type { Group, GroupRequest } from '../types';

export function useCreateGroup() {
  const [creating, setCreating] = useState(false);

  const createGroup = useCallback(async (payload: GroupRequest): Promise<Group> => {
    setCreating(true);
    try {
      return await groupService.createGroup(payload);
    } finally {
      setCreating(false);
    }
  }, []);

  return { createGroup, creating };
}
