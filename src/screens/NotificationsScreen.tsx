import { useCallback, useLayoutEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppNotification, HomeStackParamList, NotificationType, TabParamList } from '../types';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useNotifications } from '../hooks/useContexts';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { openNotificationLink } from '../utils/notificationLinks';
import { timeAgo } from '../utils/relativeTime';
import { spacing, useAppTheme } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Notifications'>,
  BottomTabScreenProps<TabParamList>
>;

const ICONS: Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  GROUP_MEMBER: 'account-plus-outline',
  GROUP_DOCUMENT: 'file-document-outline',
  GROUP_SESSION: 'calendar-outline',
  DIRECT_MESSAGE: 'message-text-outline',
  BADGE: 'trophy-outline',
  ANNOUNCEMENT: 'bullhorn-outline',
};

export function NotificationsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { unreadNotifications, setUnreadNotifications, refresh: refreshCounters } = useNotifications();
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) => getNotifications(page, size, signal),
    []
  );
  const { items, setItems, isLoading, isRefreshing, isLoadingMore, error, loadMore, refresh, retry } =
    usePaginatedList<AppNotification>(fetchPage, 15);

  const markAll = useCallback(async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadNotifications(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refreshCounters();
    }
  }, [setItems, setUnreadNotifications, refreshCounters]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button compact onPress={markAll} disabled={unreadNotifications === 0} accessibilityLabel="Marcar todo como leído">
          Leer todo
        </Button>
      ),
    });
  }, [navigation, markAll, unreadNotifications]);

  const open = (notification: AppNotification) => {
    if (!notification.read) {
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
      setUnreadNotifications((count) => Math.max(count - 1, 0));
      markNotificationRead(notification.id).catch(() => undefined);
    }
    openNotificationLink(navigation, notification.link);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => open(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Sin leer. '}${item.title}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: item.read ? theme.colors.surface : theme.colors.primaryContainer,
          borderColor: theme.colors.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name={ICONS[item.type] ?? 'bell-outline'} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.body}>
        <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
          {item.title}
        </Text>
        {item.body ? (
          <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {item.body}
          </Text>
        ) : null}
        <Text variant="labelSmall" style={{ color: theme.colors.muted, marginTop: 4 }}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
      {!item.read ? <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} /> : null}
    </Pressable>
  );

  if (isLoading) return <ListSkeleton count={5} label="Cargando notificaciones" />;

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            refresh();
            refreshCounters();
          }}
        />
      }
      contentContainerStyle={[screenPadding, items.length === 0 && styles.emptyList]}
      ListEmptyComponent={
        error ? (
          <StateView kind="error" title="No pudimos cargar tus notificaciones" message={error} actionLabel="Reintentar" onAction={retry} />
        ) : (
          <StateView
            kind="empty"
            icon="bell-check-outline"
            title="Estás al día"
            message="Aquí verás la actividad de tus grupos, tus mensajes y tus logros."
          />
        )
      }
      ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.more} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 6,
  },
  emptyList: {
    flexGrow: 1,
  },
  more: {
    marginVertical: spacing.md,
  },
});
