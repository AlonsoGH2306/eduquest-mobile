import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatAttachment, GroupMessage, GroupsStackParamList } from '../types';
import * as groupService from '../services/groupService';
import { useAuth } from '../hooks/useContexts';
import { useRealtimeEvents } from '../hooks/useRealtime';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { mergeById, replaceMessage } from '../utils/chatMessages';
import { canSeeUsers } from '../utils/roles';
import { ChatThread, ChatItem } from '../components/ChatThread';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupThread'>;

const toItem = (message: GroupMessage): ChatItem => ({
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
  reactions: message.reactions,
  poll: message.poll,
});

export function GroupThreadScreen({ route }: Props) {
  const { groupId, rootId, canManage = false } = route.params;
  const { user } = useAuth();
  const [root, setRoot] = useState<GroupMessage | null>(null);
  const [replies, setReplies] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const withMine = useCallback((message: GroupMessage) => ({ ...message, mine: message.authorId === user?.id }), [user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    groupService
      .getThread(groupId, rootId, controller.signal)
      .then((thread) => {
        setRoot(withMine(thread.root));
        setReplies(thread.replies.map(withMine));
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [groupId, rootId, reloadKey, withMine]);

  useRealtimeEvents((event) => {
    if (event.type !== 'group.message' || event.groupId !== groupId) return;
    const message = withMine(event.message as GroupMessage);
    if (message.id === rootId) setRoot(message);
    else if (message.threadRootId === rootId) {
      setReplies((current) => (event.action === 'created' ? mergeById(current, [message]) : replaceMessage(current, message)));
    }
  });

  const update = (updated: GroupMessage) => {
    const message = withMine(updated);
    if (message.id === rootId) setRoot(message);
    else setReplies((current) => replaceMessage(current, message));
  };

  const items = useMemo(() => (root ? [toItem(root), ...replies.map(toItem)] : []), [root, replies]);

  return (
    <ChatThread
      messages={items}
      loading={loading}
      error={error}
      loadingOlder={false}
      showAuthors
      allowReply={false}
      placeholder="Responder en el hilo"
      emptyTitle="Hilo vacío"
      emptyMessage="Responde para empezar la conversación."
      typingNames={[]}
      canModerate={canManage || canSeeUsers(user?.roles)}
      currentUserId={user?.id}
      myUsername={user?.username}
      onSend={async (content: string, attachment?: ChatAttachment) => {
        const sent = await groupService.sendMessage(groupId, { content, ...attachment, threadRootId: rootId });
        setReplies((current) => mergeById(current, [withMine(sent)]));
      }}
      onEdit={async (messageId, content) => update(await groupService.editMessage(groupId, messageId, content))}
      onDelete={async (messageId) => update(await groupService.deleteMessage(groupId, messageId))}
      onReact={async (messageId, emoji) => update(await groupService.toggleReaction(groupId, messageId, emoji))}
      onVote={async (pollId, optionId) => update(await groupService.votePoll(groupId, pollId, optionId))}
      onTyping={() => undefined}
      onLoadOlder={() => undefined}
      onRetry={() => setReloadKey((key) => key + 1)}
    />
  );
}
