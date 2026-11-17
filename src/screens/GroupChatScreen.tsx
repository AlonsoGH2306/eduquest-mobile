import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Chip, IconButton, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChannelSettings, GroupChannel, GroupMember, GroupsStackParamList } from '../types';
import { useGroupChat } from '../hooks/useGroupChat';
import { useGroupChannels } from '../hooks/useGroupChannels';
import { useAuth, useMyGroups, useToast } from '../hooks/useContexts';
import { getGroupMembers } from '../services/groupService';
import { canSeeUsers } from '../utils/roles';
import { ChatThread, ChatItem } from '../components/ChatThread';
import { ChannelDialog } from '../components/ChannelDialog';
import { CreatePollDialog } from '../components/CreatePollDialog';
import { SummaryDialog } from '../components/SummaryDialog';
import { ModerationDialog } from '../components/ModerationDialog';
import { StateView } from '../components/StateView';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupChat'>;

export function GroupChatScreen({ route, navigation }: Props) {
  const { groupId, channelId: initialChannelId, messageId, canManage = false } = route.params;
  const theme = useAppTheme();
  const { user } = useAuth();
  const { markChatSeen } = useMyGroups();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(initialChannelId ?? null);
  const channelState = useGroupChannels(groupId, selectedId);
  const { channels, markRead } = channelState;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [focusId, setFocusId] = useState<number | null>(messageId ?? null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [channelDialog, setChannelDialog] = useState<{ visible: boolean; channel: GroupChannel | null }>({
    visible: false,
    channel: null,
  });
  const [pollOpen, setPollOpen] = useState(false);
  const activeChannel = channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null;
  const canModerate = canManage || canSeeUsers(user?.roles);
  const chat = useGroupChat(groupId, activeChannel?.id ?? null);
  const { messages, loading, error } = chat;
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useEffect(() => {
    if (initialChannelId) setSelectedId(initialChannelId);
  }, [initialChannelId]);

  useEffect(() => {
    if (messageId) setFocusId(messageId);
  }, [messageId]);

  const { loadAround } = chat;
  useEffect(() => {
    if (focusId === null || loading || error) return;
    if (messages.some((message) => message.id === focusId)) return;
    loadAround(focusId)
      .then((found) => {
        if (!found) {
          showToast('Ese mensaje ya no está en este canal.', 'info');
          setFocusId(null);
        }
      })
      .catch(() => setFocusId(null));
  }, [focusId, loading, error, messages, loadAround, showToast]);

  const clearFocus = useCallback(() => {
    setFocusId(null);
    navigation.setParams({ messageId: undefined });
  }, [navigation]);

  useEffect(() => {
    const controller = new AbortController();
    getGroupMembers(groupId, controller.signal)
      .then(setMembers)
      .catch(() => undefined);
    return () => controller.abort();
  }, [groupId]);

  useEffect(() => {
    if (loading || error || !activeChannel) return;
    markChatSeen(groupId).catch(() => undefined);
    markRead(activeChannel.id);
  }, [lastMessageId, loading, error, groupId, markChatSeen, activeChannel?.id, markRead]);

  useLayoutEffect(() => {
    if (!activeChannel) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton icon="creation" accessibilityLabel="Ponme al día con IA" onPress={() => setSummaryOpen(true)} />
          {canModerate ? (
            <IconButton icon="shield-alert-outline" accessibilityLabel="Moderación del chat" onPress={() => setModerationOpen(true)} />
          ) : null}
          <IconButton
            icon="pin-outline"
            accessibilityLabel="Mensajes fijados"
            onPress={() => navigation.navigate('GroupChatSearch', { groupId, channelId: activeChannel.id, mode: 'pins' })}
          />
          <IconButton
            icon="magnify"
            accessibilityLabel="Buscar en el chat"
            onPress={() => navigation.navigate('GroupChatSearch', { groupId, channelId: activeChannel.id, mode: 'search' })}
          />
        </View>
      ),
    });
  }, [navigation, groupId, activeChannel, canModerate]);

  const mentionCandidates = useMemo(
    () => members.filter((member) => member.id !== user?.id).map((member) => member.username),
    [members, user?.id]
  );

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
        authorKey: message.authorId,
        authorUsername: message.authorUsername,
        authorAvatarUrl: message.authorAvatarUrl,
        authorAdvisor: message.authorAdvisor,
        editedAt: message.editedAt,
        deleted: message.deleted,
        replyTo: message.replyTo,
        pinned: message.pinned,
        reactions: message.reactions,
        threadReplyCount: message.threadReplyCount,
        poll: message.poll,
        saved: message.saved,
      })),
    [messages]
  );

  const saveChannel = async (settings: ChannelSettings) => {
    if (channelDialog.channel) {
      await channelState.updateChannel(channelDialog.channel.id, settings);
      showToast('Canal actualizado', 'success');
    } else {
      const created = await channelState.createChannel(settings);
      setSelectedId(created.id);
      showToast('Canal creado', 'success');
    }
  };

  const deleteChannel = async (channel: GroupChannel) => {
    await channelState.deleteChannel(channel.id);
    if (channel.id === activeChannel?.id) setSelectedId(null);
    showToast(`Canal #${channel.name} eliminado`, 'success');
  };

  if (channelState.loading) return <StateView kind="loading" message="Cargando canales" />;
  if (channelState.error) {
    return (
      <StateView
        kind="error"
        title="No pudimos abrir el chat"
        message={channelState.error}
        actionLabel="Reintentar"
        onAction={channelState.retry}
      />
    );
  }

  const channelBar = (
    <View style={[styles.channelBar, { borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channels}>
        {channels.map((channel) => {
          const active = channel.id === activeChannel?.id;
          return (
            <View key={channel.id}>
              <Chip
                icon={channel.readOnly ? 'bullhorn-outline' : 'pound'}
                compact
                selected={active}
                showSelectedOverlay
                onPress={() => setSelectedId(channel.id)}
                onLongPress={canModerate ? () => setChannelDialog({ visible: true, channel }) : undefined}
                accessibilityHint={canModerate ? 'Mantén presionado para editar el canal' : undefined}
                textStyle={!active && channel.unreadCount > 0 ? styles.unread : undefined}
              >
                {channel.name}
              </Chip>
              {!active && channel.mentionCount > 0 ? (
                <Badge size={18} style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                  {`@${channel.mentionCount}`}
                </Badge>
              ) : !active && channel.unreadCount > 0 ? (
                <Badge size={18} style={styles.badge}>
                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                </Badge>
              ) : null}
            </View>
          );
        })}
        {canModerate ? (
          <Chip icon="plus" compact mode="outlined" onPress={() => setChannelDialog({ visible: true, channel: null })}>
            Canal
          </Chip>
        ) : null}
      </ScrollView>
      {activeChannel && activeChannel.slowModeSeconds > 0 ? (
        <Text variant="labelSmall" style={[styles.topic, { color: theme.colors.warning }]}>
          Modo lento: {activeChannel.slowModeSeconds} s entre mensajes
        </Text>
      ) : null}
      {activeChannel?.topic ? (
        <Text variant="labelSmall" numberOfLines={1} style={[styles.topic, { color: theme.colors.muted }]}>
          {activeChannel.topic}
        </Text>
      ) : null}
    </View>
  );

  return (
    <>
      <ChatThread
        messages={items}
        loading={loading}
        error={error}
        loadingOlder={chat.loadingOlder}
        showAuthors
        header={channelBar}
        placeholder={`Mensaje para #${activeChannel?.name ?? 'general'}`}
        emptyTitle={`Aún no hay mensajes en #${activeChannel?.name ?? 'general'}`}
        emptyMessage="Saluda al grupo o plantea tu primera duda."
        typingNames={chat.typingNames}
        canModerate={canModerate}
        canPin={canModerate}
        currentUserId={user?.id}
        myUsername={user?.username}
        mentionCandidates={mentionCandidates}
        onSend={chat.sendMessage}
        onEdit={chat.editMessage}
        onDelete={chat.deleteMessage}
        onTyping={chat.notifyTyping}
        onLoadOlder={chat.loadOlder}
        onRetry={chat.retry}
        onReact={chat.toggleReaction}
        onTogglePin={(item) => chat.togglePin(item.id, !item.pinned)}
        onVote={chat.votePoll}
        onOpenThread={(item) => navigation.navigate('GroupThread', { groupId, rootId: item.id, canManage })}
        onCreatePoll={() => setPollOpen(true)}
        onToggleSaved={(item) => chat.toggleSaved(item.id, !item.saved)}
        composerNotice={
          activeChannel?.readOnly && !canModerate
            ? 'Canal de anuncios: solo el creador y los moderadores pueden escribir.'
            : null
        }
        focusMessageId={focusId}
        onFocusHandled={clearFocus}
      />
      <SummaryDialog
        groupId={groupId}
        channelId={summaryOpen ? (activeChannel?.id ?? null) : null}
        channelName={activeChannel?.name ?? ''}
        onDismiss={() => setSummaryOpen(false)}
      />
      <ModerationDialog groupId={groupId} visible={moderationOpen} onDismiss={() => setModerationOpen(false)} />
      <ChannelDialog
        visible={channelDialog.visible}
        channel={channelDialog.channel}
        onSave={saveChannel}
        onDelete={channels.length > 1 ? deleteChannel : undefined}
        onDismiss={() => setChannelDialog({ visible: false, channel: null })}
      />
      <CreatePollDialog visible={pollOpen} onCreate={chat.createPoll} onDismiss={() => setPollOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
  },
  channelBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
  },
  channels: {
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  unread: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  topic: {
    paddingHorizontal: spacing.md,
    paddingTop: 4,
  },
});
