import { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupMessage, GroupsStackParamList } from '../types';
import * as groupService from '../services/groupService';
import { useDebounce } from '../hooks/useDebounce';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { previewOf } from '../utils/chatMessages';
import { UserAvatar } from '../components/UserAvatar';
import { StateView } from '../components/StateView';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupChatSearch'>;

const formatWhen = (value: string) =>
  new Date(value).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function GroupChatSearchScreen({ route, navigation }: Props) {
  const { groupId, channelId, mode } = route.params;
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query.trim(), 350);
  const [results, setResults] = useState<GroupMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: mode === 'pins' ? 'Mensajes fijados' : 'Buscar en el chat' });
  }, [navigation, mode]);

  useEffect(() => {
    if (mode === 'search' && debounced.length < 2) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const request =
      mode === 'pins'
        ? groupService.getPinned(groupId, channelId, controller.signal)
        : groupService.searchMessages(groupId, debounced, undefined, controller.signal);
    request
      .then(setResults)
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode, debounced, groupId, channelId]);

  const open = (message: GroupMessage) => {
    if (message.threadRootId) {
      navigation.navigate('GroupThread', { groupId, rootId: message.threadRootId });
    } else {
      navigation.popTo(
        'GroupChat',
        { groupId, channelId: message.channelId ?? channelId, messageId: message.id },
        { merge: true }
      );
    }
  };

  const renderItem = ({ item }: { item: GroupMessage }) => (
    <Pressable
      onPress={() => open(item)}
      accessibilityRole="button"
      style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}
    >
      <UserAvatar username={item.authorUsername} avatarUrl={item.authorAvatarUrl} size={34} />
      <View style={styles.body}>
        <Text variant="labelMedium" style={{ color: theme.colors.ink }}>
          @{item.authorUsername} <Text style={{ color: theme.colors.muted }}>· {formatWhen(item.createdAt)}</Text>
        </Text>
        <Text variant="bodyMedium" numberOfLines={3} style={{ color: theme.colors.onSurfaceVariant }}>
          {previewOf(item) || item.poll?.question || 'Mensaje'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {mode === 'search' ? (
        <Searchbar
          placeholder="Palabra o frase…"
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.search}
          accessibilityLabel="Buscar mensajes"
        />
      ) : null}
      {loading ? (
        <StateView kind="loading" message={mode === 'pins' ? 'Cargando fijados' : 'Buscando'} />
      ) : error ? (
        <StateView kind="error" title="Algo salió mal" message={error} />
      ) : results === null ? (
        <StateView kind="empty" compact icon="magnify" title="Busca en todo el grupo" message="Escribe al menos 2 caracteres." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <StateView
              kind="empty"
              compact
              icon={mode === 'pins' ? 'pin-outline' : 'magnify'}
              title={mode === 'pins' ? 'Sin mensajes fijados' : 'Sin resultados'}
              message={mode === 'pins' ? 'Los moderadores pueden fijar mensajes importantes.' : 'Prueba con otras palabras.'}
            />
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
  search: {
    margin: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
  },
});
