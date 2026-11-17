import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, FAB, Searchbar, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DocumentItem, LibraryStackParamList } from '../types';
import { ScreenTitle } from '../components/ScreenTitle';
import { DocumentRow } from '../components/DocumentRow';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { useDebounce } from '../hooks/useDebounce';
import { useDocuments } from '../hooks/useDocuments';
import type { DocumentSort } from '../services/documentService';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<LibraryStackParamList, 'LibraryList'>;

const SORT_OPTIONS: { value: DocumentSort; label: string }[] = [
  { value: 'recent', label: 'Recientes' },
  { value: 'oldest', label: 'Antiguos' },
  { value: 'title', label: 'A-Z' },
];

export function LibraryScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [searchInput, setSearchInput] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<DocumentSort>('recent');
  const [view, setView] = useState<'all' | 'saved'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [courseInput, setCourseInput] = useState('');
  const [universityInput, setUniversityInput] = useState('');
  const search = useDebounce(searchInput, 450);
  const course = useDebounce(courseInput.trim(), 450);
  const university = useDebounce(universityInput.trim(), 450);
  const savedOnly = view === 'saved';
  const activeFilters = [course, university].filter(Boolean).length;
  const {
    documents,
    totalElements,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
  } = useDocuments({ search, tag, course, university, sort, savedOnly });

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  const openDocument = useCallback(
    (document: DocumentItem) => navigation.navigate('DocumentDetail', { document }),
    [navigation]
  );

  const header = (
    <View>
      <ScreenTitle title="Biblioteca" subtitle="Apuntes, guías y exámenes compartidos por la comunidad." />
      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as 'all' | 'saved')}
        buttons={[
          { value: 'all', label: 'Todos', icon: 'bookshelf' },
          { value: 'saved', label: 'Guardados', icon: 'bookmark-outline' },
        ]}
        style={styles.segments}
      />
      {savedOnly ? null : (
        <>
          <Searchbar
            placeholder="Busca por curso o tema"
            value={searchInput}
            onChangeText={setSearchInput}
            style={[styles.search, { backgroundColor: theme.colors.surfaceVariant }]}
            inputStyle={styles.searchInput}
            autoCorrect={false}
          />
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                compact
                selected={sort === option.value}
                showSelectedCheck={false}
                onPress={() => setSort(option.value)}
                style={sort === option.value ? { backgroundColor: theme.colors.primaryContainer } : undefined}
                accessibilityLabel={`Ordenar por ${option.label.toLowerCase()}`}
              >
                {option.label}
              </Chip>
            ))}
            <Chip
              compact
              icon="filter-variant"
              selected={showFilters || activeFilters > 0}
              showSelectedCheck={false}
              onPress={() => setShowFilters((value) => !value)}
              style={activeFilters > 0 ? { backgroundColor: theme.colors.primaryContainer } : undefined}
            >
              {activeFilters > 0 ? `Filtros (${activeFilters})` : 'Filtros'}
            </Chip>
          </View>
          {showFilters ? (
            <View style={styles.filters}>
              <TextInput
                mode="outlined"
                dense
                label="Curso"
                value={courseInput}
                onChangeText={setCourseInput}
                left={<TextInput.Icon icon="school-outline" />}
                maxLength={100}
              />
              <TextInput
                mode="outlined"
                dense
                label="Universidad o colegio"
                value={universityInput}
                onChangeText={setUniversityInput}
                left={<TextInput.Icon icon="domain" />}
                maxLength={100}
              />
            </View>
          ) : null}
        </>
      )}
      <View style={styles.meta}>
        {tag ? (
          <Chip icon="tag-outline" onClose={() => setTag('')} closeIcon="close" compact>
            #{tag}
          </Chip>
        ) : null}
        {!isLoading && !error ? (
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            {totalElements === 1 ? '1 material' : `${totalElements} materiales`}
            {savedOnly ? ' guardados' : search ? ` para "${search}"` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const empty = isLoading ? (
    <ListSkeleton count={6} label="Cargando la biblioteca" />
  ) : error ? (
    <StateView kind="error" title="No pudimos cargar la biblioteca" message={error} actionLabel="Reintentar" onAction={retry} />
  ) : savedOnly ? (
    <StateView
      kind="empty"
      icon="bookmark-outline"
      title="Aún no guardas materiales"
      message="Abre un material y toca Guardar para tenerlo siempre a mano aquí."
    />
  ) : search || tag || activeFilters > 0 ? (
    <StateView
      kind="empty"
      icon="file-search-outline"
      title="Sin resultados"
      message="Prueba con otra palabra o quita algún filtro."
    />
  ) : (
    <StateView
      kind="empty"
      title="Todavía no hay materiales"
      message="Comparte tu primer apunte y ayuda a tus compañeros."
      actionLabel="Subir material"
      onAction={() => navigation.navigate('UploadDocument')}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={isLoading ? [] : documents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <DocumentRow document={item} onPress={openDocument} onPressTag={setTag} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footer} />
          ) : error && documents.length > 0 ? (
            <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={retry} />
          ) : !hasMore && documents.length > 0 ? (
            <Text variant="bodySmall" style={[styles.end, { color: theme.colors.muted }]}>
              Llegaste al final de la biblioteca.
            </Text>
          ) : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        contentContainerStyle={screenPadding}
        keyboardShouldPersistTaps="handled"
      />
      <FAB
        icon="upload"
        label="Subir material"
        onPress={() => navigation.navigate('UploadDocument')}
        style={[styles.fab, { backgroundColor: theme.colors.highlight }]}
        color={theme.colors.onHighlight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segments: {
    marginBottom: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  filters: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  search: {
    borderRadius: 16,
    elevation: 0,
  },
  searchInput: {
    minHeight: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 24,
  },
  footer: {
    marginVertical: spacing.lg,
  },
  end: {
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 18,
  },
});
