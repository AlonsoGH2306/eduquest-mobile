import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { Group } from '../types';
import { normalizeGroupCode } from '../utils/groupQr';
import { isCanceled } from '../utils/errors';
import { useDebounce } from './useDebounce';

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function useGroupSearch() {
  const [term, setTerm] = useState('');
  const query = useDebounce(term.trim(), 400);
  const [codeMatch, setCodeMatch] = useState<Group | null>(null);
  const [searchingCode, setSearchingCode] = useState(false);

  const code = normalizeGroupCode(query);
  const looksLikeCode = CODE_PATTERN.test(code) && !/\s/.test(query);

  useEffect(() => {
    if (!looksLikeCode) {
      setCodeMatch(null);
      return;
    }
    const controller = new AbortController();
    setSearchingCode(true);
    groupService
      .getGroupByCode(code, controller.signal)
      .then(setCodeMatch)
      .catch((err) => {
        if (!isCanceled(err)) setCodeMatch(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearchingCode(false);
      });
    return () => controller.abort();
  }, [code, looksLikeCode]);

  const updateCodeMatch = useCallback((group: Group) => {
    setCodeMatch((current) => (current?.id === group.id ? group : current));
  }, []);

  return { term, setTerm, nameQuery: query, codeMatch, searchingCode, updateCodeMatch };
}
