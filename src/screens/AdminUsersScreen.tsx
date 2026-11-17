import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile } from '../types';
import { UserRow } from '../components/UserRow';
import { RoleDialog } from '../components/RoleDialog';
import { BanDialog } from '../components/BanDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAuth, useToast } from '../hooks/useContexts';
import { isAdmin, roleLabel, RoleName } from '../utils/roles';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

export function AdminUsersScreen() {
  const theme = useAppTheme();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const {
    users,
    totalElements,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    retry,
    changeRole,
    banUser,
    unbanUser,
  } = useAdminUsers();
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toBan, setToBan] = useState<UserProfile | null>(null);
  const [toUnban, setToUnban] = useState<UserProfile | null>(null);
  const [moderating, setModerating] = useState(false);

  const canEdit = isAdmin(currentUser?.roles);
  const canModerateUser = (user: UserProfile) =>
    user.id !== currentUser?.id && !user.roles.includes('ROLE_ADMIN') && (canEdit || !user.roles.includes('ROLE_MANAGER'));

  const openEditor = useCallback((user: UserProfile) => setEditing(user), []);
  const toggleBan = useCallback(
    (user: UserProfile) => (user.banned ? setToUnban(user) : setToBan(user)),
    []
  );

  const confirmBan = async (user: UserProfile, reason: string, days: number | null) => {
    setModerating(true);
    try {
      await banUser(user.id, reason, days);
      showToast(days === null ? `@${user.username} fue vetado` : `@${user.username} quedó suspendido ${days} días`, 'success');
      setToBan(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setModerating(false);
    }
  };

  const confirmUnban = async () => {
    if (!toUnban) return;
    setModerating(true);
    try {
      await unbanUser(toUnban.id);
      showToast(`@${toUnban.username} puede volver a usar EduQuest`, 'success');
      setToUnban(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setModerating(false);
    }
  };

  const saveRole = async (user: UserProfile, role: RoleName) => {
    setSaving(true);
    try {
      await changeRole(user.id, role);
      showToast(`@${user.username} ahora es ${roleLabel(role).toLowerCase()}`, 'success');
      setEditing(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View>
      <View style={[styles.summary, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={canEdit ? 'shield-account-outline' : 'eye-outline'}
          size={26}
          color={theme.colors.primary}
        />
        <View style={styles.summaryText}>
          <Text variant="titleMedium" style={{ color: theme.colors.ink }}>
            {isLoading ? 'Cargando cuentas…' : `${totalElements} ${totalElements === 1 ? 'cuenta' : 'cuentas'} registradas`}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {canEdit
              ? 'Toca una cuenta para cambiar su rol, o el ícono de la derecha para vetarla si incumplió las normas.'
              : 'Como gestor puedes ver las cuentas. Solo un administrador cambia roles.'}
          </Text>
        </View>
      </View>
    </View>
  );

  const empty = isLoading ? (
    <ListSkeleton count={6} avatar="circle" label="Cargando usuarios" />
  ) : error ? (
    <StateView kind="error" title="No pudimos cargar los usuarios" message={error} actionLabel="Reintentar" onAction={retry} />
  ) : (
    <StateView kind="empty" icon="account-off-outline" title="No hay cuentas registradas" />
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={isLoading ? [] : users}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            isCurrentUser={item.id === currentUser?.id}
            editable={canEdit && item.id !== currentUser?.id}
            onPress={openEditor}
            onToggleBan={canModerateUser(item) ? toggleBan : undefined}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footer} />
          ) : error && users.length > 0 ? (
            <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={retry} />
          ) : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        contentContainerStyle={screenPadding}
      />
      <RoleDialog user={editing} saving={saving} onSave={saveRole} onDismiss={() => setEditing(null)} />
      <BanDialog
        user={toBan}
        saving={moderating}
        allowPermanent={canEdit}
        onConfirm={confirmBan}
        onDismiss={() => setToBan(null)}
      />
      <ConfirmDialog
        visible={toUnban !== null}
        title={`Quitar el veto a @${toUnban?.username ?? ''}`}
        message="Podrá volver a iniciar sesión y usar EduQuest con normalidad."
        confirmLabel="Quitar veto"
        loading={moderating}
        onConfirm={confirmUnban}
        onCancel={() => setToUnban(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.md,
  },
  summaryText: {
    flex: 1,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
