import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import type { AppealStatus, BanAppeal } from '../types';
import { decideAppeal, getAppeals } from '../services/adminService';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { useToast } from '../hooks/useContexts';
import { formatDateTime } from '../utils/format';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

const PAGE_SIZE = 20;

export function AdminAppealsScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [status, setStatus] = useState<AppealStatus>('PENDING');
  const [appeals, setAppeals] = useState<BanAppeal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        const page = await getAppeals(status, 0, PAGE_SIZE, signal);
        setAppeals(page.content);
      } catch (err) {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      }
    },
    [status]
  );

  useEffect(() => {
    const controller = new AbortController();
    setAppeals(null);
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const decide = async (appeal: BanAppeal, accepted: boolean) => {
    setBusyId(appeal.id);
    try {
      await decideAppeal(appeal.id, accepted, responses[appeal.id] ?? '');
      setAppeals((current) => current?.filter((item) => item.id !== appeal.id) ?? null);
      showToast(accepted ? `Levantaste la suspensión de @${appeal.username}` : 'La suspensión se mantiene', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const renderAppeal = ({ item }: { item: BanAppeal }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Text variant="titleMedium" style={{ color: theme.colors.ink }}>
        @{item.username}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
        {item.bannedUntil ? `Suspendido hasta el ${formatDateTime(item.bannedUntil)}` : 'Veto permanente'} · Motivo:{' '}
        {item.banReason ?? 'sin detalle'}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.ink, backgroundColor: theme.colors.surfaceVariant }]}>
        {item.message}
      </Text>
      {item.status === 'PENDING' ? (
        <>
          <TextInput
            mode="outlined"
            dense
            placeholder="Respuesta opcional"
            value={responses[item.id] ?? ''}
            onChangeText={(text) => setResponses((current) => ({ ...current, [item.id]: text }))}
            maxLength={500}
          />
          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => decide(item, false)} disabled={busyId === item.id}>
              Rechazar
            </Button>
            <Button mode="contained" onPress={() => decide(item, true)} disabled={busyId === item.id} loading={busyId === item.id}>
              Aceptar
            </Button>
          </View>
        </>
      ) : (
        <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: spacing.sm }}>
          {item.status === 'ACCEPTED' ? 'Aceptada' : 'Rechazada'} por @{item.reviewedBy}
          {item.response ? ` · «${item.response}»` : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.segment}>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => setStatus(value as AppealStatus)}
          buttons={[
            { value: 'PENDING', label: 'Pendientes' },
            { value: 'ACCEPTED', label: 'Aceptadas' },
            { value: 'REJECTED', label: 'Rechazadas' },
          ]}
        />
      </View>
      {error ? (
        <StateView kind="error" title="No pudimos cargar las apelaciones" message={error} actionLabel="Reintentar" onAction={() => load()} />
      ) : appeals === null ? (
        <ListSkeleton count={3} label="Cargando apelaciones" />
      ) : (
        <FlatList
          data={appeals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAppeal}
          contentContainerStyle={[screenPadding, appeals.length === 0 && styles.flexGrow]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <StateView kind="empty" icon="scale-balance" title="Sin apelaciones" message="Cuando un usuario suspendido apele, aparecerá aquí." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  message: {
    marginVertical: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
