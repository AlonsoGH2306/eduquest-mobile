import { useCallback, useState } from 'react';
import * as documentService from '../services/documentService';
import * as groupService from '../services/groupService';
import type { DocumentItem, DocumentRequest } from '../types';

export function useUploadDocument(groupId?: number) {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (payload: DocumentRequest): Promise<DocumentItem> => {
      setUploading(true);
      try {
        return groupId
          ? await groupService.uploadGroupDocument(groupId, payload)
          : await documentService.createDocument(payload);
      } finally {
        setUploading(false);
      }
    },
    [groupId]
  );

  return { upload, uploading };
}
