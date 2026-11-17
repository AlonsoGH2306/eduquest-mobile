import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, SegmentedButtons, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Report, ReportStatus, UserProfile } from '../types';
import { BanDialog } from '../components/BanDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { useAdminReports } from '../hooks/useAdminReports';
import { useAuth, useToast } from '../hooks/useContexts';
import { formatDateTime } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { isAdmin } from '../utils/roles';
import { spacing, useAppTheme } from '../theme';

export function AdminReportsScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const admin = isAdmin(user?.roles);
  const [status, setStatus] = useState<ReportStatus>('OPEN');
  const { reports, isLoading, isRefreshing, isLoadingMore, error, loadMore, refresh, retry, closeReport, banReportedUser, deleteReportedDocument } =
    useAdminReports(status);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toBan, setToBan] = useState<Report | null>(null);
  const [toDelete, setToDelete] = useState<Report | null>(null);

  const run = async (report: Report, action: () => Promise<void>, message: string) => {
    setBusyId(report.id);
    try {
      await action();
      showToast(message, 'success');
      return true;
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const banTarget: UserProfile | null = toBan
    ? { id: toBan.targetId, username: toBan.targetLabel ?? '', email: '', roles: [] }
    : null;

  const renderReport = ({ item }: { item: Report }) => {
    const isUser = item.targetType === 'USER';
    const busy = busyId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name={isUser ? 'account-alert-outline' : 'file-alert-outline'}
            size={22}
            color={isUser ? theme.colors.error : theme.colors.primary}
          />
          <View style={styles.flex}>
            <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.ink }}>
              {isUser ? `@${item.targetLabel}` : item.targetLabel}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              Por @{item.reporterUsername}, {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <Text variant="bodyMedium" style={[styles.reason, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}>
          {item.reason}
        </Text>
        {item.status === 'OPEN' ? (
          <View style={styles.actions}>
            <Button compact disabled={busy} onPress={() => run(item, () => closeReport(item, 'DISMISSED'), 'Reporte descartado')}>
              Descartar
            </Button>
            <Button
              compact
              mode="contained-tonal"
              disabled={busy}
              onPress={() => run(item, () => closeReport(item, 'RESOLVED'), 'Reporte resuelto')}
            >
              Resuelto
            </Button>
            <Button
              compact
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              disabled={busy}
              onPress={() => (isUser ? setToBan(item) : setToDelete(item))}
            >
              {isUser ? 'Suspender' : 'Eliminar'}
            </Button>
          </View>
        ) : (
          <Text variant="bodySmall" style={[styles.closed, { color: theme.colors.muted }]}>
            {item.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'} por @{item.resolvedByUsername}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={isLoading ? [] : reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReport}
        ListHeaderComponent={
          <SegmentedButtons
            value={status}
            onValueChange={(value) => setStatus(value as ReportStatus)}
            buttons={[
              { value: 'OPEN', label: 'Pendientes' },
              { value: 'RESOLVED', label: 'Resueltos' },
              { value: 'DISMISSED', label: 'Descartados' },
            ]}
            style={styles.segment}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ListSkeleton count={3} avatar="none" label="Cargando reportes" />
          ) : error ? (
            <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={retry} />
          ) : (
            <StateView
              kind="empty"
              compact
              icon="shield-check-outline"
              title={status === 'OPEN' ? 'No hay reportes pendientes' : 'Sin reportes aquí'}
              message={status === 'OPEN' ? 'La comunidad está en orden.' : undefined}
            />
          )
        }
        ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footer} /> : undefined}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        contentContainerStyle={screenPadding}
      />

      <BanDialog
        user={banTarget}
        saving={busyId !== null}
        allowPermanent={admin}
        onConfirm={async (_, reason, days) => {
          if (!toBan) return;
          const done = await run(
            toBan,
            () => banReportedUser(toBan, reason, days),
            days === null ? 'Usuario vetado y reporte resuelto' : 'Usuario suspendido y reporte resuelto'
          );
          if (done) setToBan(null);
        }}
        onDismiss={() => setToBan(null)}
      />

      <ConfirmDialog
        visible={toDelete !== null}
        title="¿Eliminar el material?"
        message={`«${toDelete?.targetLabel ?? ''}» y sus reseñas se borrarán para todos. No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={busyId !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const done = await run(toDelete, () => deleteReportedDocument(toDelete), 'Material eliminado y reporte resuelto');
          if (done) setToDelete(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segment: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reason: {
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  closed: {
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
