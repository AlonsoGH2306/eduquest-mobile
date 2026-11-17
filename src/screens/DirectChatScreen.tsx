import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupsStackParamList, HomeStackParamList } from '../types';
import { useDirectChat } from '../hooks/useDirectChat';
import { useAuth, useNotifications } from '../hooks/useContexts';
import { getUserSummary, markConversationRead } from '../services/messageService';
import { ChatThread, ChatItem } from '../components/ChatThread';
import { getStatuses } from '../services/personalService';
import { availabilityColor, availabilityLabel } from '../utils/availability';
import type { UserStatus } from '../types';
import { useAppTheme } from '../theme';

type Props =
  | NativeStackScreenProps<HomeStackParamList, 'DirectChat'>
  | NativeStackScreenProps<GroupsStackParamList, 'DirectChat'>;

export function DirectChatScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    loadingOlder,
    typingNames,
    notifyTyping,
    sendMessage,
    editMessage,
    deleteMessage,
    loadOlder,
    retry,
  } = useDirectChat(userId);
  const { refresh: refreshCounters } = useNotifications();
  const theme = useAppTheme();
  const [title, setTitle] = useState(username ? `@${username}` : 'Mensaje');
  const [status, setStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getStatuses([userId], controller.signal)
      .then((list) => setStatus(list[0] ?? null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [userId]);
  const lastIncomingId = useMemo(
    () => [...messages].reverse().find((message) => !message.mine)?.id ?? null,
    [messages]
  );

  useEffect(() => {
    if (username) return;
    const controller = new AbortController();
    getUserSummary(userId, controller.signal)
      .then((partner) => setTitle(`@${partner.username}`))
      .catch(() => undefined);
    return () => controller.abort();
  }, [userId, username]);

  useLayoutEffect(() => {
    const subtitle = status
      ? [status.online ? availabilityLabel(status.availability) : 'Desconectado', [status.statusEmoji, status.statusText].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(' · ')
      : null;
    navigation.setOptions({
      title,
      headerTitle: () => (
        <View>
          <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.ink }}>
            {title}
          </Text>
          {subtitle ? (
            <View style={styles.subtitle}>
              <View style={[styles.dot, { backgroundColor: availabilityColor(status?.availability, status?.online) }]} />
              <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.muted }}>
                {subtitle}
              </Text>
            </View>
          ) : null}
        </View>
      ),
    });
  }, [navigation, title, status, theme]);

  useEffect(() => {
    if (loading || error) return;
    markConversationRead(userId)
      .then(refreshCounters)
      .catch(() => undefined);
  }, [lastIncomingId, loading, error, userId, refreshCounters]);

  const items = useMemo<ChatItem[]>(
    () =>
      messages.map((message) => ({
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        sticker: message.sticker,
        mine: message.mine,
        createdAt: message.createdAt,
        authorKey: message.senderId,
        editedAt: message.editedAt,
        deleted: message.deleted,
        replyTo: message.replyTo,
      })),
    [messages]
  );

  return (
    <ChatThread
      messages={items}
      loading={loading}
      error={error}
      loadingOlder={loadingOlder}
      showAuthors={false}
      placeholder={username ? `Mensaje para @${username}` : 'Escribe un mensaje'}
      emptyTitle="Empieza la conversación"
      emptyMessage="Coordina, resuelve dudas o comparte material en privado."
      typingNames={typingNames}
      partnerUsername={username}
      myUsername={user?.username}
      onSend={sendMessage}
      onEdit={editMessage}
      onDelete={deleteMessage}
      onTyping={notifyTyping}
      onLoadOlder={loadOlder}
      onRetry={retry}
    />
  );
}

const styles = StyleSheet.create({
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
