import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Searchbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, PinnedChatKind, UserSummary } from '../types';
import { useConversations } from '../hooks/useConversations';
import { useRooms } from '../hooks/useRooms';
import { usePinnedChats } from '../hooks/usePinnedChats';
import { useDebounce } from '../hooks/useDebounce';
import { searchUsers } from '../services/messageService';
import { UserAvatar } from '../components/UserAvatar';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { timeAgo } from '../utils/relativeTime';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Conversations'>;

interface ChatEntry {
  key: string;
  kind: PinnedChatKind;
  targetId: number;
  title: string;
  preview: string;
  at: string;
  unread: number;
  pinned: boolean;
  partner?: UserSummary;
  memberCount?: number;
}

export function ConversationsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { conversations, loading, refreshing, error, reload, refresh } = useConversations();
  const rooms = useRooms();
  const { isPinned, togglePin } = usePinnedChats();
  const reloadRooms = rooms.reload;

  const entries = useMemo<ChatEntry[]>(() => {
    const list: ChatEntry[] = [
      ...conversations.map((item) => ({
        key: `direct-${item.partner.id}`,
        kind: 'DIRECT' as const,
        targetId: item.partner.id,
        title: `@${item.partner.username}`,
        preview: `${item.lastMessageMine ? 'Tú: ' : ''}${item.lastMessage}`,
        at: item.lastMessageAt,
        unread: item.unreadCount,
        pinned: isPinned('DIRECT', item.partner.id),
        partner: item.partner,
      })),
      ...rooms.rooms.map((room) => ({
        key: `room-${room.id}`,
        kind: 'ROOM' as const,
        targetId: room.id,
        title: room.name,
        preview: room.lastMessage ?? `${room.members.length} integrantes`,
        at: room.lastActivityAt,
        unread: room.unreadCount,
        pinned: isPinned('ROOM', room.id),
        memberCount: room.members.length,
      })),
    ];
    return list.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));
  }, [conversations, rooms.rooms, isPinned]);
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim().replace(/^@/, ''), 300);
  const [results, setResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const searchingPeople = query.length >= 2;

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadRooms();
    }, [reload, reloadRooms])
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    searchUsers(query, controller.signal)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [query]);

  const openChat = (user: UserSummary) => {
    setSearch('');
    navigation.navigate('DirectChat', { userId: user.id, username: user.username });
  };

  const renderPerson = ({ item }: { item: UserSummary }) => (
    <Pressable
      onPress={() => openChat(item)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <UserAvatar username={item.username} avatarUrl={item.avatarUrl} size={40} />
      <Text variant="titleMedium" style={[styles.flex, { color: theme.colors.ink }]}>
        @{item.username}
        {item.advisor ? <Text style={{ color: theme.colors.warning }}> · Asesor</Text> : null}
      </Text>
    </Pressable>
  );

  const openEntry = (item: ChatEntry) => {
    if (item.partner) openChat(item.partner);
    else navigation.navigate('RoomChat', { roomId: item.targetId, name: item.title });
  };

  const renderConversation = ({ item }: { item: ChatEntry }) => {
    const unread = item.unread > 0;
    return (
      <Pressable
        onPress={() => openEntry(item)}
        onLongPress={() => togglePin(item.kind, item.targetId)}
        accessibilityRole="button"
        accessibilityLabel={`Chat ${item.title}${unread ? `, ${item.unread} sin leer` : ''}${item.pinned ? ', fijado' : ''}`}
        accessibilityHint={item.pinned ? 'Mantén presionado para desfijar' : 'Mantén presionado para fijar arriba'}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {item.partner ? (
          <UserAvatar username={item.partner.username} avatarUrl={item.partner.avatarUrl} size={46} />
        ) : (
          <Avatar.Icon size={46} icon="account-group" />
        )}
        <View style={styles.flex}>
          <View style={styles.line}>
            {item.pinned ? <MaterialCommunityIcons name="pin" size={14} color={theme.colors.primary} /> : null}
            <Text variant="titleMedium" numberOfLines={1} style={[styles.flex, { color: theme.colors.ink }]}>
              {item.title}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
              {timeAgo(item.at)}
            </Text>
          </View>
          <View style={styles.line}>
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={[styles.flex, { color: unread ? theme.colors.ink : theme.colors.muted, fontWeight: unread ? '600' : '400' }]}
            >
              {item.preview}
            </Text>
            {unread ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text style={[styles.badgeText, { color: theme.colors.onError }]}>
                  {item.unread > 99 ? '99+' : item.unread}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const header = (
    <View>
      <Searchbar
        placeholder="Buscar por @usuario"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
        accessibilityLabel="Buscar personas"
      />
      {!searchingPeople ? (
        <View style={styles.headerActions}>
          <Button
            mode="contained-tonal"
            icon="account-multiple-plus"
            compact
            onPress={() => navigation.navigate('CreateRoom')}
          >
            Chat grupal
          </Button>
          <Button mode="text" icon="bookmark-outline" compact onPress={() => navigation.navigate('SavedMessages')}>
            Guardados
          </Button>
        </View>
      ) : null}
    </View>
  );

  if (searchingPeople) {
    return (
      <FlatList
        style={{ backgroundColor: theme.colors.background }}
        data={searching ? [] : results}
        keyExtractor={(item) => `user-${item.id}`}
        renderItem={renderPerson}
        ListHeaderComponent={header}
        ListEmptyComponent={
          searching ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <StateView kind="empty" compact icon="account-search-outline" title="Sin resultados" message="No encontramos a nadie con ese usuario." />
          )
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={screenPadding}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={loading ? [] : entries}
      keyExtractor={(item) => item.key}
      renderItem={renderConversation}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? (
          <ListSkeleton count={4} avatar="circle" label="Cargando conversaciones" />
        ) : error ? (
          <StateView kind="error" title="No pudimos cargar tus mensajes" message={error} actionLabel="Reintentar" onAction={reload} />
        ) : (
          <StateView
            kind="empty"
            icon="message-text-outline"
            title="Aún no tienes conversaciones"
            message="Busca a alguien por su usuario, escríbele desde un grupo o crea un chat grupal."
          />
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={screenPadding}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    marginTop: spacing.lg,
  },
});
