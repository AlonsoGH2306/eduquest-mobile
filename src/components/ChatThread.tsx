import { ReactElement, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Chip, Dialog, IconButton, List, Portal, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserAvatar } from './UserAvatar';
import { useOpenProfile } from '../hooks/useOpenProfile';
import { StateView } from './StateView';
import { ConfirmDialog } from './ConfirmDialog';
import type { ChatAttachment, ChatReply, MessageReaction, Poll } from '../types';
import { DELETED_LABEL, previewOf } from '../utils/chatMessages';
import { typingLabel } from '../hooks/useRealtime';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';
import { uploadedFileUrl } from '../utils/documentPreview';
import { uploadFile } from '../services/documentService';
import { MENTION_QUERY } from '../utils/richText';
import { RichText } from './RichText';
import { StickerView } from './StickerView';
import { StickerSheet } from './StickerSheet';
import { PollCard } from './PollCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { FONTS, spacing, useAppTheme } from '../theme';

export interface ChatItem {
  id: number;
  content: string;
  imageUrl?: string | null;
  mine: boolean;
  createdAt: string;
  authorKey: number;
  authorUsername?: string;
  authorAvatarUrl?: string | null;
  authorAdvisor?: boolean;
  editedAt?: string | null;
  deleted?: boolean;
  replyTo?: ChatReply | null;
  fileUrl?: string | null;
  fileName?: string | null;
  sticker?: string | null;
  pinned?: boolean;
  reactions?: MessageReaction[];
  threadReplyCount?: number;
  poll?: Poll | null;
  saved?: boolean;
}

interface ComposerContext {
  mode: 'reply' | 'edit';
  item: ChatItem;
}

interface ChatThreadProps {
  messages: ChatItem[];
  loading: boolean;
  error: string | null;
  loadingOlder: boolean;
  showAuthors: boolean;
  placeholder: string;
  emptyTitle: string;
  emptyMessage: string;
  typingNames: string[];
  canModerate?: boolean;
  partnerUsername?: string;
  currentUserId?: number;
  myUsername?: string;
  mentionCandidates?: string[];
  header?: ReactNode;
  allowReply?: boolean;
  canPin?: boolean;
  onSend: (content: string, attachment?: ChatAttachment, replyToId?: number) => Promise<void>;
  onEdit: (messageId: number, content: string) => Promise<void>;
  onDelete: (messageId: number) => Promise<void>;
  onTyping: () => void;
  onLoadOlder: () => void;
  onRetry: () => void;
  onReact?: (messageId: number, emoji: string) => Promise<void>;
  onOpenThread?: (item: ChatItem) => void;
  onTogglePin?: (item: ChatItem) => Promise<void>;
  onVote?: (pollId: number, optionId: number | null) => Promise<void>;
  onCreatePoll?: () => void;
  onToggleSaved?: (item: ChatItem) => Promise<void>;
  composerNotice?: string | null;
  focusMessageId?: number | null;
  onFocusHandled?: () => void;
}

const QUICK_REACTION = '👍';
const DOUBLE_TAP_MS = 300;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_FILE = /\.(mp4|webm|mov)$/i;
const MAX_SUGGESTIONS = 5;

const MAX_LENGTH = 1000;
const timeOf = (value: string) =>
  new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export function ChatThread({
  messages,
  loading,
  error,
  loadingOlder,
  showAuthors,
  placeholder,
  emptyTitle,
  emptyMessage,
  typingNames,
  canModerate = false,
  partnerUsername,
  currentUserId,
  myUsername,
  mentionCandidates = [],
  header,
  allowReply = true,
  canPin = false,
  onSend,
  onEdit,
  onDelete,
  onTyping,
  onLoadOlder,
  onRetry,
  onReact,
  onOpenThread,
  onTogglePin,
  onVote,
  onCreatePoll,
  onToggleSaved,
  composerNotice,
  focusMessageId,
  onFocusHandled,
}: ChatThreadProps) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachMenu, setAttachMenu] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [playing, setPlaying] = useState<ChatItem | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const listRef = useRef<FlatList<ChatItem>>(null);
  const lastTap = useRef<{ id: number; at: number } | null>(null);
  const [context, setContext] = useState<ComposerContext | null>(null);
  const [selected, setSelected] = useState<ChatItem | null>(null);
  const [toDelete, setToDelete] = useState<ChatItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const savedDraft = useRef('');
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const typing = typingLabel(typingNames);
  const mentionQuery = MENTION_QUERY.exec(draft)?.[1] ?? null;
  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return mentionCandidates.filter((name) => name.toLowerCase().startsWith(query)).slice(0, MAX_SUGGESTIONS);
  }, [mentionQuery, mentionCandidates]);

  const insertMention = (username: string) => {
    setDraft((current) => current.replace(/@([A-Za-z0-9_.-]{0,30})$/, `@${username} `));
  };

  const authorOf = (item: ChatItem) => (item.mine ? 'ti' : `@${item.authorUsername ?? partnerUsername ?? ''}`);

  const startReply = (item: ChatItem) => {
    setSelected(null);
    if (context?.mode === 'edit') setDraft(savedDraft.current);
    setContext({ mode: 'reply', item });
  };

  const startEdit = (item: ChatItem) => {
    setSelected(null);
    if (context?.mode !== 'edit') savedDraft.current = draft;
    setDraft(item.content);
    setContext({ mode: 'edit', item });
  };

  const cancelContext = () => {
    if (context?.mode === 'edit') setDraft(savedDraft.current);
    setContext(null);
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      if (context?.mode === 'edit') {
        await onEdit(context.item.id, content);
        setDraft(savedDraft.current);
        savedDraft.current = '';
      } else {
        await onSend(content, undefined, context?.item.id);
        setDraft('');
      }
      setContext(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onDelete(toDelete.id);
      if (context?.item.id === toDelete.id) cancelContext();
      setToDelete(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const sendAttachment = async (attachment: ChatAttachment) => {
    await onSend(draft.trim(), attachment, context?.mode === 'reply' ? context.item.id : undefined);
    setDraft('');
    setContext(null);
  };

  const withUpload = async (task: () => Promise<void>) => {
    setUploading(true);
    try {
      await task();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const sendImage = async () => {
    setAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Activa el acceso a tus fotos para enviar imágenes.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      showToast('La imagen no debe superar los 25 MB.', 'error');
      return;
    }
    await withUpload(async () => {
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName ?? 'imagen.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      await sendAttachment({ imageUrl: uploaded.url });
    });
  };

  const sendVideo = async () => {
    setAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Activa el acceso a tu galería para enviar videos.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
      showToast('El video no debe superar los 50 MB.', 'error');
      return;
    }
    const mimeType = asset.mimeType ?? 'video/mp4';
    const extension = mimeType === 'video/quicktime' ? 'mov' : mimeType === 'video/webm' ? 'webm' : 'mp4';
    const name = asset.fileName && VIDEO_FILE.test(asset.fileName) ? asset.fileName : `video.${extension}`;
    await withUpload(async () => {
      const uploaded = await uploadFile({ uri: asset.uri, name, mimeType });
      await sendAttachment({ fileUrl: uploaded.url, fileName: name });
    });
  };

  const sendDocument = async () => {
    setAttachMenu(false);
    const result = await DocumentPicker.getDocumentAsync({ type: DOCUMENT_TYPES, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_BYTES) {
      showToast('El archivo no debe superar los 10 MB.', 'error');
      return;
    }
    await withUpload(async () => {
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
      await sendAttachment({ fileUrl: uploaded.url, fileName: asset.name });
    });
  };

  const sendSticker = (sticker: string) => {
    void withUpload(() => sendAttachment({ sticker }));
  };

  const react = async (item: ChatItem, emoji: string) => {
    setSelected(null);
    if (!onReact) return;
    try {
      await onReact(item.id, emoji);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  useEffect(() => {
    if (!focusMessageId || loading) return;
    const index = newestFirst.findIndex((item) => item.id === focusMessageId);
    if (index < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
      setHighlightedId(focusMessageId);
      onFocusHandled?.();
    }, 150);
    return () => clearTimeout(timer);
  }, [focusMessageId, loading, newestFirst, onFocusHandled]);

  useEffect(() => {
    if (highlightedId === null) return;
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  const handleTap = (item: ChatItem) => {
    if (!onReact || item.deleted) return;
    const now = Date.now();
    if (lastTap.current?.id === item.id && now - lastTap.current.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      void react(item, QUICK_REACTION);
      return;
    }
    lastTap.current = { id: item.id, at: now };
  };

  const toggleSaved = async (item: ChatItem) => {
    setSelected(null);
    if (!onToggleSaved) return;
    try {
      await onToggleSaved(item);
      showToast(item.saved ? 'Quitado de guardados' : 'Guardado para después', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const togglePin = async (item: ChatItem) => {
    setSelected(null);
    if (!onTogglePin) return;
    try {
      await onTogglePin(item);
      showToast(item.pinned ? 'Mensaje desfijado' : 'Mensaje fijado', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const openProfile = useOpenProfile();

  const renderMessage = ({ item, index }: { item: ChatItem; index: number }): ReactElement => {
    const older = newestFirst[index + 1];
    const grouped = older?.authorKey === item.authorKey;
    const showAuthor = showAuthors && !item.mine;
    return (
      <View
        style={[
          styles.messageRow,
          item.mine && styles.mineRow,
          !grouped && styles.spaced,
          highlightedId === item.id && { backgroundColor: theme.colors.primaryContainer, borderRadius: 12 },
        ]}
      >
        {showAuthor ? (
          <View style={styles.avatarSlot}>
            {!grouped ? (
              <Pressable
                onPress={() => openProfile(item.authorKey)}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${item.authorUsername ?? ''}`}
              >
                <UserAvatar username={item.authorUsername ?? ''} avatarUrl={item.authorAvatarUrl ?? null} size={30} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={[styles.bubbleColumn, item.mine && styles.mineColumn]}>
          {!grouped && showAuthor ? (
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
              @{item.authorUsername}
              {item.authorAdvisor ? <Text style={{ color: theme.colors.warning }}> · Asesor</Text> : null}
            </Text>
          ) : null}
          {item.pinned && !item.deleted ? (
            <View style={styles.pinned}>
              <MaterialCommunityIcons name="pin" size={12} color={theme.colors.warning} />
              <Text variant="labelSmall" style={{ color: theme.colors.warning }}>
                Fijado
              </Text>
            </View>
          ) : null}
          {item.replyTo && !item.deleted ? (
            <View style={[styles.quote, { backgroundColor: theme.colors.surfaceVariant, borderLeftColor: theme.colors.primary }]}>
              <Text variant="labelSmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                <Text style={{ fontWeight: '700' }}>@{item.replyTo.authorUsername}</Text>{' '}
                <Text style={item.replyTo.deleted ? styles.italic : undefined}>{item.replyTo.preview}</Text>
              </Text>
            </View>
          ) : null}
          {item.deleted ? (
            <View style={[styles.deleted, { borderColor: theme.colors.outlineVariant }]}>
              <MaterialCommunityIcons name="cancel" size={14} color={theme.colors.muted} />
              <Text variant="bodySmall" style={[styles.italic, { color: theme.colors.muted }]}>
                {DELETED_LABEL}
              </Text>
            </View>
          ) : null}
          {item.sticker && !item.deleted ? (
            <Pressable onLongPress={() => setSelected(item)} accessibilityHint="Mantén presionado para ver opciones">
              <StickerView value={item.sticker} />
            </Pressable>
          ) : null}
          {item.imageUrl && !item.deleted ? (
            <Pressable
              onLongPress={() => setSelected(item)}
              onPress={() => Linking.openURL(uploadedFileUrl(item.imageUrl ?? ''))}
              accessibilityRole="imagebutton"
              accessibilityLabel="Abrir imagen"
            >
              <Image
                source={{ uri: uploadedFileUrl(item.imageUrl) }}
                style={[styles.image, { backgroundColor: theme.colors.surfaceVariant }]}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
          {item.fileUrl && !item.deleted && VIDEO_FILE.test(item.fileName ?? '') ? (
            <Pressable
              onPress={() => setPlaying(item)}
              onLongPress={() => setSelected(item)}
              accessibilityRole="button"
              accessibilityLabel={`Reproducir video ${item.fileName ?? ''}`}
              style={styles.video}
            >
              <MaterialCommunityIcons name="play-circle" size={56} color="#FFFFFF" />
              <Text variant="labelSmall" numberOfLines={1} style={styles.videoName}>
                {item.fileName}
              </Text>
            </Pressable>
          ) : null}
          {item.fileUrl && !item.deleted && !VIDEO_FILE.test(item.fileName ?? '') ? (
            <Pressable
              onPress={() => Linking.openURL(uploadedFileUrl(item.fileUrl ?? ''))}
              onLongPress={() => setSelected(item)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir archivo ${item.fileName ?? ''}`}
              style={[styles.file, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.fileIcon, { backgroundColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.colors.onPrimary} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyMedium" numberOfLines={1} style={{ color: theme.colors.ink, fontWeight: '600' }}>
                  {item.fileName ?? 'Archivo'}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
                  Toca para abrir
                </Text>
              </View>
              <MaterialCommunityIcons name="download" size={18} color={theme.colors.muted} />
            </Pressable>
          ) : null}
          {item.poll && onVote && !item.deleted ? (
            <Pressable onLongPress={() => setSelected(item)}>
              <PollCard poll={item.poll} currentUserId={currentUserId} onVote={onVote} />
            </Pressable>
          ) : null}
          {item.content && !item.deleted ? (
            <Pressable
              onPress={() => handleTap(item)}
              onLongPress={() => setSelected(item)}
              delayLongPress={300}
              accessibilityHint="Toca dos veces para reaccionar; mantén presionado para más opciones"
              style={[
                styles.bubble,
                item.imageUrl && styles.afterImage,
                item.mine
                  ? { backgroundColor: theme.colors.primary, borderTopRightRadius: 6 }
                  : { backgroundColor: theme.colors.surfaceVariant, borderTopLeftRadius: 6 },
              ]}
            >
              <RichText
                content={item.content}
                color={item.mine ? theme.colors.onPrimary : theme.colors.onSurface}
                inverted={item.mine}
                myUsername={myUsername}
              />
            </Pressable>
          ) : null}
          {item.reactions && item.reactions.length > 0 && !item.deleted ? (
            <View style={[styles.reactions, item.mine && styles.mineReactions]}>
              {item.reactions.map((reaction) => {
                const reacted = currentUserId !== undefined && reaction.userIds.includes(currentUserId);
                return (
                  <Pressable
                    key={reaction.emoji}
                    onPress={() => react(item, reaction.emoji)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: reacted }}
                    accessibilityLabel={`${reaction.emoji} ${reaction.count}`}
                    style={[
                      styles.reaction,
                      {
                        borderColor: reacted ? theme.colors.primary : theme.colors.outlineVariant,
                        backgroundColor: reacted ? theme.colors.primaryContainer : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text variant="labelMedium">{reaction.emoji}</Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {reaction.count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {onOpenThread && (item.threadReplyCount ?? 0) > 0 && !item.deleted ? (
            <Pressable onPress={() => onOpenThread(item)} accessibilityRole="button" style={styles.threadLink}>
              <MaterialCommunityIcons name="message-text-outline" size={14} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {item.threadReplyCount === 1 ? '1 respuesta en el hilo' : `${item.threadReplyCount} respuestas en el hilo`}
              </Text>
            </Pressable>
          ) : null}
          <Text style={[styles.time, { color: theme.colors.muted }]}>
            {timeOf(item.createdAt)}
            {item.editedAt && !item.deleted ? ' · editado' : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {header}
        {loading ? (
          <StateView kind="loading" message="Cargando mensajes" />
        ) : error ? (
          <StateView kind="error" title="No pudimos abrir el chat" message={error} actionLabel="Reintentar" onAction={onRetry} />
        ) : newestFirst.length === 0 ? (
          <View style={styles.emptyChat}>
            <StateView kind="empty" title={emptyTitle} message={emptyMessage} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={newestFirst}
            onScrollToIndexFailed={({ index, averageItemLength }) => {
              listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
              setTimeout(() => listRef.current?.scrollToIndex({ index, viewPosition: 0.5 }), 100);
            }}
            inverted
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            onEndReached={onLoadOlder}
            onEndReachedThreshold={0.3}
            contentContainerStyle={styles.list}
            ListFooterComponent={loadingOlder ? <ActivityIndicator style={styles.older} /> : undefined}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {typing ? (
          <Text variant="labelSmall" style={[styles.typing, styles.italic, { color: theme.colors.muted }]}>
            {typing}
          </Text>
        ) : null}
        {context ? (
          <View style={[styles.contextBar, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={context.mode === 'reply' ? 'reply' : 'pencil-outline'}
              size={18}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" numberOfLines={1} style={[styles.contextText, { color: theme.colors.onSurfaceVariant }]}>
              <Text style={{ fontWeight: '700' }}>
                {context.mode === 'reply' ? `Respondiendo a ${authorOf(context.item)}: ` : 'Editando: '}
              </Text>
              {previewOf(context.item)}
            </Text>
            <IconButton icon="close" size={18} onPress={cancelContext} accessibilityLabel="Cancelar" style={styles.contextClose} />
          </View>
        ) : null}
        {suggestions.length > 0 ? (
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.suggestions}
            style={[styles.suggestionBar, { backgroundColor: theme.colors.surface }]}
          >
            {suggestions.map((name) => (
              <Chip key={name} icon="at" compact onPress={() => insertMention(name)}>
                {name}
              </Chip>
            ))}
          </ScrollView>
        ) : null}
        {composerNotice ? (
          <View style={[styles.notice, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.flex, { color: theme.colors.onSurfaceVariant }]}>
              {composerNotice}
            </Text>
          </View>
        ) : (
          <View style={[styles.composer, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
            {context?.mode !== 'edit' ? (
              <IconButton
                icon="plus-circle-outline"
                onPress={() => setAttachMenu(true)}
                disabled={sending || uploading}
                loading={uploading}
                accessibilityLabel="Adjuntar archivo, sticker o encuesta"
              />
            ) : null}
            <View style={[styles.inputBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <TextInput
                placeholder={placeholder}
                placeholderTextColor={theme.colors.muted}
                value={draft}
                onChangeText={(text) => {
                  setDraft(text);
                  if (text.trim()) onTyping();
                }}
                multiline
                maxLength={MAX_LENGTH}
                selectionColor={theme.colors.primary}
                style={[styles.input, { color: theme.colors.ink }]}
                accessibilityLabel="Mensaje"
              />
            </View>
            <IconButton
              icon={context?.mode === 'edit' ? 'check' : 'send'}
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor={theme.colors.onPrimary}
              onPress={send}
              disabled={sending || !draft.trim()}
              accessibilityLabel={context?.mode === 'edit' ? 'Guardar cambios' : 'Enviar mensaje'}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={selected !== null} onDismiss={() => setSelected(null)}>
          <Dialog.Content>
            {selected ? (
              <Text variant="bodyMedium" numberOfLines={3} style={{ color: theme.colors.muted }}>
                {previewOf(selected)}
              </Text>
            ) : null}
          </Dialog.Content>
          {onReact && selected && !selected.deleted ? (
            <View style={styles.quickReactions}>
              {QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => react(selected, emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={`Reaccionar con ${emoji}`}
                  style={styles.quickReaction}
                >
                  <Text style={styles.quickEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {allowReply ? (
            <List.Item
              title="Responder"
              left={(props) => <List.Icon {...props} icon="reply" />}
              onPress={() => selected && startReply(selected)}
            />
          ) : null}
          {onOpenThread && selected ? (
            <List.Item
              title="Responder en hilo"
              left={(props) => <List.Icon {...props} icon="message-text-outline" />}
              onPress={() => {
                setSelected(null);
                onOpenThread(selected);
              }}
            />
          ) : null}
          {onToggleSaved && selected && !selected.deleted ? (
            <List.Item
              title={selected.saved ? 'Quitar de guardados' : 'Guardar para después'}
              left={(props) => <List.Icon {...props} icon={selected.saved ? 'bookmark-remove-outline' : 'bookmark-outline'} />}
              onPress={() => toggleSaved(selected)}
            />
          ) : null}
          {canPin && onTogglePin && selected ? (
            <List.Item
              title={selected.pinned ? 'Desfijar' : 'Fijar en el canal'}
              left={(props) => <List.Icon {...props} icon={selected.pinned ? 'pin-off-outline' : 'pin-outline'} />}
              onPress={() => togglePin(selected)}
            />
          ) : null}
          {selected?.mine && selected.content ? (
            <List.Item
              title="Editar"
              left={(props) => <List.Icon {...props} icon="pencil-outline" />}
              onPress={() => selected && startEdit(selected)}
            />
          ) : null}
          {selected && (selected.mine || canModerate) ? (
            <List.Item
              title="Eliminar"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="delete-outline" color={theme.colors.error} />}
              onPress={() => {
                setToDelete(selected);
                setSelected(null);
              }}
            />
          ) : null}
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={attachMenu} onDismiss={() => setAttachMenu(false)}>
          <Dialog.Title>Adjuntar</Dialog.Title>
          <List.Item title="Foto" left={(props) => <List.Icon {...props} icon="image-outline" />} onPress={sendImage} />
          <List.Item
            title="Video"
            description="Hasta 50 MB"
            left={(props) => <List.Icon {...props} icon="video-outline" />}
            onPress={sendVideo}
          />
          <List.Item
            title="Archivo"
            description="PDF, Word, PowerPoint, Excel o texto"
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            onPress={sendDocument}
          />
          <List.Item
            title="Sticker"
            left={(props) => <List.Icon {...props} icon="sticker-emoji" />}
            onPress={() => {
              setAttachMenu(false);
              setStickersOpen(true);
            }}
          />
          {onCreatePoll ? (
            <List.Item
              title="Encuesta"
              left={(props) => <List.Icon {...props} icon="poll" />}
              onPress={() => {
                setAttachMenu(false);
                onCreatePoll();
              }}
            />
          ) : null}
        </Dialog>
      </Portal>

      <VideoPlayerModal
        url={playing?.fileUrl ? uploadedFileUrl(playing.fileUrl) : null}
        title={playing?.fileName}
        onClose={() => setPlaying(null)}
      />

      <StickerSheet visible={stickersOpen} onPick={sendSticker} onDismiss={() => setStickersOpen(false)} />

      <ConfirmDialog
        visible={toDelete !== null}
        title="Eliminar mensaje"
        message="Se mostrará «Mensaje eliminado» en su lugar. No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 240,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  video: {
    width: 240,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  videoName: {
    color: '#FFFFFF',
    marginTop: 6,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  mineReactions: {
    justifyContent: 'flex-end',
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  threadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  suggestionBar: {
    flexGrow: 0,
  },
  suggestions: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  quickReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickReaction: {
    padding: 6,
  },
  quickEmoji: {
    fontSize: 24,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
  },
  older: {
    marginVertical: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  spaced: {
    marginTop: spacing.sm + 2,
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  avatarSlot: {
    width: 30,
  },
  bubbleColumn: {
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  mineColumn: {
    alignItems: 'flex-end',
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  afterImage: {
    marginTop: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  time: {
    fontFamily: FONTS.body,
    fontSize: 10,
    marginTop: 2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBox: {
    flex: 1,
    minHeight: 44,
    maxHeight: 128,
    marginVertical: 4,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    textAlignVertical: 'center',
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  deleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  italic: {
    fontStyle: 'italic',
  },
  typing: {
    paddingHorizontal: spacing.md,
    paddingBottom: 2,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  contextText: {
    flex: 1,
  },
  contextClose: {
    margin: 0,
  },
});
