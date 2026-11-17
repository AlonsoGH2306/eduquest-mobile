import { useCallback, useState } from 'react';
import * as groupService from '../services/groupService';
import type { Group } from '../types';
import type { GroupReference } from '../utils/groupQr';

export function useGroupLookup() {
  const [looking, setLooking] = useState(false);

  const lookup = useCallback(async (reference: GroupReference): Promise<Group> => {
    setLooking(true);
    try {
      return reference.kind === 'code'
        ? await groupService.getGroupByCode(reference.code)
        : await groupService.getGroup(reference.id);
    } finally {
      setLooking(false);
    }
  }, []);

  return { lookup, looking };
}
