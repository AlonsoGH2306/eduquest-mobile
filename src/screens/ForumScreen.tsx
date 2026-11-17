import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ForumFilter, ForumQuestion, HomeStackParamList } from '../types';
import { getQuestions } from '../services/forumService';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useRealtimeEvents } from '../hooks/useRealtime';
import { useDebounce } from '../hooks/useDebounce';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { timeAgo } from '../utils/relativeTime';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Forum'>;

export function ForumScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ForumFilter>('all');
  const debounced = useDebounce(search, 400);

  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) =>
      getQuestions({ search: debounced.trim() || undefined, filter, page, size }, signal),
    [debounced, filter]
  );
  const { items, isLoading, isRefreshing, isLoadingMore, error, loadMore, refresh, refreshSilently, retry } =
    usePaginatedList(fetchPage);

  useRealtimeEvents((event) => {
    if (event.type === 'forum') refreshSilently();
  });

  const renderQuestion = ({ item }: { item: ForumQuestion }) => (
    <Pressable
      onPress={() => navigation.navigate('ForumThread', { questionId: item.id })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={[styles.count, { backgroundColor: item.solved ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={item.solved ? 'check-decagram' : 'forum-outline'}
          size={18}
          color={item.solved ? theme.colors.primary : theme.colors.muted}
        />
        <Text variant="labelLarge" style={{ color: theme.colors.ink }}>
          {item.answerCount}
        </Text>
      </View>
      <View style={styles.body}>
        <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.ink }}>
          {item.title}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.muted, marginTop: 2 }}>
          {item.course ? `${item.course} · ` : ''}@{item.author.username} · {timeAgo(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar placeholder="Buscar preguntas" value={search} onChangeText={setSearch} style={styles.search} />
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as ForumFilter)}
          buttons={[
            { value: 'all', label: 'Todas' },
            { value: 'unanswered', label: 'Sin responder' },
            { value: 'solved', label: 'Resueltas' },
          ]}
        />
      </View>
      {isLoading ? (
        <ListSkeleton count={4} label="Cargando preguntas" />
      ) : error && items.length === 0 ? (
        <StateView kind="error" title="No pudimos cargar el foro" message={error} actionLabel="Reintentar" onAction={retry} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderQuestion}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={[screenPadding, items.length === 0 && styles.flexGrow]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: spacing.md }} /> : undefined}
          ListEmptyComponent={
            <StateView kind="empty" icon="forum-outline" title="No hay preguntas aquí" message="Sé el primero en preguntar." />
          }
        />
      )}
      <FAB icon="plus" label="Preguntar" style={styles.fab} onPress={() => navigation.navigate('AskQuestion')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
  header: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  search: {
    borderRadius: 16,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  count: {
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
  },
});
