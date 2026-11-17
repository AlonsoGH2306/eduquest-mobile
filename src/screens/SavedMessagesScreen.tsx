import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { HomeStackParamList, SavedMessage, TabParamList } from '../types';
import { getSavedMessages, setSaved } from '../services/groupService';
import { useAuth, useToast } from '../hooks/useContexts';
import { UserAvatar } from '../components/UserAvatar';
import { RichText } from '../components/RichText';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { getErrorMessage } from '../utils/errors';
import { timeAgo } from '../utils/relativeTime';
import { spacing, useAppTheme } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'SavedMessages'>,
  BottomTabScreenProps<TabParamList>
>;

export function SavedMessagesScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await getSavedMessages());
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const remove = async (item: SavedMessage) => {
    setItems((current) => current.filter((saved) => saved.message.id !== item.message.id));
    try {
      await setSaved(item.groupId, item.message.id, false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      void load();
    }
  };

  const open = (item: SavedMessage) =>
    navigation.navigate('Groups', {
      screen: 'GroupChat',
      params: {
        groupId: item.groupId,
        groupName: item.groupName,
        channelId: item.message.channelId ?? undefined,
        messageId: item.message.id,
      },
    });

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={screenPadding}
      data={loading ? [] : items}
      keyExtractor={(item) => String(item.message.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => open(item)}
          accessibilityRole="button"
          accessibilityHint="Abre el chat en este mensaje"
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.head}>
            <UserAvatar username={item.message.authorUsername} avatarUrl={item.message.authorAvatarUrl} size={32} />
            <View style={styles.flex}>
              <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.ink }}>
                @{item.message.authorUsername}
              </Text>
              <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.muted }}>
                {item.groupName}
                {item.channelName ? ` · #${item.channelName}` : ''} · {timeAgo(item.message.createdAt)}
              </Text>
            </View>
            <IconButton icon="bookmark-remove-outline" accessibilityLabel="Quitar de guardados" onPress={() => remove(item)} />
          </View>
          {item.message.content ? (
            <RichText content={item.message.content} color={theme.colors.ink} myUsername={user?.username} />
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              {item.message.sticker ? 'Sticker' : item.message.imageUrl ? 'Imagen' : item.message.fileName ?? 'Adjunto'}
            </Text>
          )}
        </Pressable>
      )}
      ListEmptyComponent={
        loading ? (
          <ListSkeleton count={4} avatar="circle" label="Cargando mensajes guardados" />
        ) : error ? (
          <StateView kind="error" title="No pudimos cargar tus guardados" message={error} actionLabel="Reintentar" onAction={load} />
        ) : (
          <StateView
            kind="empty"
            icon="bookmark-outline"
            title="Nada guardado todavía"
            message="Mantén presionado un mensaje de un grupo y elige «Guardar para después»."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
