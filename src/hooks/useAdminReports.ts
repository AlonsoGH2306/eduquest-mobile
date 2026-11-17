import { useCallback } from 'react';
import * as adminService from '../services/adminService';
import type { Report, ReportStatus } from '../types';
import { usePaginatedList } from './usePaginatedList';

export function useAdminReports(status: ReportStatus) {
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) => adminService.getReports(status, page, size, signal),
    [status]
  );
  const list = usePaginatedList<Report>(fetchPage, 10);
  const { setItems } = list;

  const closeReport = useCallback(
    async (report: Report, newStatus: Exclude<ReportStatus, 'OPEN'>) => {
      await adminService.closeReport(report.id, newStatus);
      setItems((items) => items.filter((item) => item.id !== report.id));
    },
    [setItems]
  );

  const banReportedUser = useCallback(
    async (report: Report, reason: string, days: number | null) => {
      await adminService.banUser(report.targetId, reason, days);
      await closeReport(report, 'RESOLVED');
    },
    [closeReport]
  );

  const deleteReportedDocument = useCallback(
    async (report: Report) => {
      await adminService.deleteDocument(report.targetId);
      await closeReport(report, 'RESOLVED');
    },
    [closeReport]
  );

  return { ...list, reports: list.items, closeReport, banReportedUser, deleteReportedDocument };
}
