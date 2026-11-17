import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { IconButton, Menu } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatRoom, HomeStackParamList } from '../types';
import { useRoomChat } from '../hooks/useRoomChat';
import { useAuth, useToast } from '../hooks/useContexts';
import { getRoom, leaveRoom, markRoomRead } from '../services/roomService';
import { ChatThread, ChatItem } from '../components/ChatThread';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoomChat'>;

const NO_TYPING: string[] = [];
const ignoreTyping = () => undefined;

export function RoomChatScreen({ route, navigation }: Props) {
  const { roomId, name } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();
  const chat = useRoomChat(roomId);
  const { messages, loading, error } = chat;
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const lastIncomingId = useMemo(() => [...messages].reverse().find((message) => !message.mine)?.id ?? null, [messages]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getRoom(roomId).then(setRoom).catch(() => undefined);
    });
    return unsubscribe;
  }, [navigation, roomId]);

  useEffect(() => {
    if (loading || error) return;
    markRoomRead(roomId).catch(() => undefined);
  }, [lastIncomingId, loading, error, roomId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: room?.name ?? name ?? 'Chat grupal',
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" accessibilityLabel="Opciones del chat" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            leadingIcon="account-edit-outline"
            title="Editar chat"
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('CreateRoom', { roomId });
            }}
          />
          <Menu.Item
            leadingIcon="logout"
            title="Salir del chat"
            onPress={() => {
              setMenuVisible(false);
              setConfirmLeave(true);
            }}
          />
        </Menu>
      ),
    });
  }, [navigation, room?.name, name, menuVisible, roomId]);

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
        editedAt: message.editedAt,
        deleted: message.deleted,
        replyTo: message.replyTo,
      })),
    [messages]
  );

  const leave = async () => {
    try {
      await leaveRoom(roomId);
      showToast('Saliste del chat', 'success');
      navigation.goBack();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <ChatThread
        messages={items}
        loading={loading}
        error={error}
        loadingOlder={chat.loadingOlder}
        showAuthors
        placeholder="Escribe al grupo"
        emptyTitle="Chat grupal creado"
        emptyMessage={
          room ? `Con ${room.members.map((member) => `@${member.username}`).join(', ')}.` : 'Saluda para empezar la conversación.'
        }
        typingNames={NO_TYPING}
        myUsername={user?.username}
        mentionCandidates={room?.members.map((member) => member.username)}
        onSend={chat.sendMessage}
        onEdit={chat.editMessage}
        onDelete={chat.deleteMessage}
        onTyping={ignoreTyping}
        onLoadOlder={chat.loadOlder}
        onRetry={chat.retry}
      />
      <ConfirmDialog
        visible={confirmLeave}
        title="Salir del chat grupal"
        message="Dejarás de recibir sus mensajes. Si eres la última persona, el chat se elimina."
        confirmLabel="Salir"
        destructive
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </>
  );
}
