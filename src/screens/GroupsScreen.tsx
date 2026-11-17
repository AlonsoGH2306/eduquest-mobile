import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, IconButton, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Group, GroupsStackParamList } from '../types';
import { ScreenTitle } from '../components/ScreenTitle';
import { GroupRow } from '../components/GroupRow';
import { MyGroupRow } from '../components/MyGroupRow';
import { usePinnedChats } from '../hooks/usePinnedChats';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { screenPadding } from '../components/Screen';
import { JoinPasswordDialog } from '../components/JoinPasswordDialog';
import { useGroups } from '../hooks/useGroups';
import { useGroupJoin } from '../hooks/useGroupJoin';
import { useGroupSearch } from '../hooks/useGroupSearch';
import { useMyGroups } from '../hooks/useContexts';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsList'>;
type GroupsView = 'mine' | 'explore';

export function GroupsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [view, setView] = useState<GroupsView>('mine');
  const myGroups = useMyGroups();
  const { term, setTerm, nameQuery, codeMatch, searchingCode, updateCodeMatch } = useGroupSearch();
  const { groups, totalElements, isLoading, isRefreshing, isLoadingMore, error, loadMore, refresh, retry } =
    useGroups(nameQuery);

  const { refresh: refreshMine } = myGroups;
  const { isPinned, togglePin } = usePinnedChats();
  const sortedMine = useMemo(
    () =>
      [...myGroups.groups].sort((a, b) => Number(isPinned('GROUP', b.id)) - Number(isPinned('GROUP', a.id))),
    [myGroups.groups, isPinned]
  );
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refreshMine();
      refresh();
    }, [refresh, refreshMine])
  );

  const openGroup = useCallback(
    (group: Group) => navigation.navigate('GroupDetail', { groupId: group.id, group }),
    [navigation]
  );

  const onJoined = useCallback(
    (group: Group) => {
      updateCodeMatch(group);
      refresh();
      refreshMine();
      openGroup(group);
    },
    [openGroup, refresh, refreshMine, updateCodeMatch]
  );
  const { start: startJoin, joiningId, dialog } = useGroupJoin(onJoined);

  const header = (
    <View>
      <ScreenTitle
        title="Grupos"
        subtitle="Tus grupos con sus novedades y nuevos grupos para unirte."
        right={
          <IconButton
            icon="qrcode-scan"
            mode="contained-tonal"
            size={26}
            onPress={() => navigation.navigate('ScanGroup')}
            accessibilityLabel="Escanear el QR de un grupo"
          />
        }
      />
      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as GroupsView)}
        buttons={[
          {
            value: 'mine',
            label: myGroups.totalUnread > 0 ? `Mis grupos (${myGroups.totalUnread} nuevos)` : 'Mis grupos',
            icon: 'account-group',
          },
          { value: 'explore', label: 'Explorar', icon: 'compass-outline' },
        ]}
        style={styles.segment}
      />
      {view === 'explore' ? (
        <>
          <Searchbar
            placeholder="Nombre del grupo o código (K7P2QX)"
            value={term}
            onChangeText={setTerm}
            onClearIconPress={() => setTerm('')}
            loading={searchingCode}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.search, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Buscar grupos por nombre o código"
          />
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.muted }]}>
            Los públicos se buscan por nombre. Un privado solo aparece con su código exacto.
          </Text>
          {codeMatch ? (
            <View style={styles.result}>
              <Text variant="labelLarge" style={[styles.resultLabel, { color: theme.colors.muted }]}>
                Coincidencia por código
              </Text>
              <GroupRow group={codeMatch} onPress={openGroup} onJoin={startJoin} joining={joiningId === codeMatch.id} />
            </View>
          ) : null}
          {!isLoading && !error && totalElements > 0 ? (
            <Text variant="bodySmall" style={[styles.count, { color: theme.colors.muted }]}>
              {totalElements === 1 ? '1 grupo' : `${totalElements} grupos`}
              {nameQuery ? ` con "${nameQuery}"` : ' disponibles'}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );

  const exploreEmpty = isLoading ? (
    <ListSkeleton count={5} label="Cargando grupos" />
  ) : error ? (
    <StateView kind="error" title="No pudimos cargar los grupos" message={error} actionLabel="Reintentar" onAction={retry} />
  ) : nameQuery ? (
    codeMatch ? undefined : (
      <StateView
        kind="empty"
        icon="magnify-close"
        title={`Sin grupos públicos con "${nameQuery}"`}
        message="Prueba con otro nombre. Si es privado, pide su código de 6 caracteres."
        actionLabel="Limpiar búsqueda"
        onAction={() => setTerm('')}
      />
    )
  ) : (
    <StateView
      kind="empty"
      icon="account-group-outline"
      title="Aún no hay grupos públicos"
      message="Crea uno para tu curso o busca uno privado con el código que te pasaron."
      actionLabel="Crear grupo"
      onAction={() => navigation.navigate('CreateGroup')}
    />
  );

  const mineEmpty = myGroups.loading ? (
    <ListSkeleton count={4} label="Cargando tus grupos" />
  ) : myGroups.error ? (
    <StateView kind="error" title="No pudimos cargar tus grupos" message={myGroups.error} actionLabel="Reintentar" onAction={myGroups.refresh} />
  ) : (
    <StateView
      kind="empty"
      icon="account-group-outline"
      title="Todavía no estás en ningún grupo"
      message="Explora los grupos públicos, escanea un QR o crea el tuyo."
      actionLabel="Explorar grupos"
      onAction={() => setView('explore')}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {view === 'mine' ? (
        <FlatList
          data={myGroups.loading ? [] : sortedMine}
          keyExtractor={(item) => `mine-${item.id}`}
          renderItem={({ item }) => (
            <MyGroupRow
              group={item}
              onPress={openGroup}
              pinned={isPinned('GROUP', item.id)}
              onTogglePin={(group) => togglePin('GROUP', group.id)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={mineEmpty}
          refreshControl={<RefreshControl refreshing={false} onRefresh={myGroups.refresh} />}
          contentContainerStyle={screenPadding}
        />
      ) : (
        <FlatList
          data={isLoading ? [] : groups}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <GroupRow group={item} onPress={openGroup} onJoin={startJoin} joining={joiningId === item.id} />
          )}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={exploreEmpty}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator style={styles.footer} />
            ) : error && groups.length > 0 ? (
              <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={retry} />
            ) : undefined
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          contentContainerStyle={screenPadding}
        />
      )}
      <FAB
        icon="plus"
        label="Crear grupo"
        onPress={() => navigation.navigate('CreateGroup')}
        style={[styles.fab, { backgroundColor: theme.colors.highlight }]}
        color={theme.colors.onHighlight}
      />
      <JoinPasswordDialog {...dialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segment: {
    marginBottom: spacing.md,
  },
  count: {
    marginBottom: spacing.md,
  },
  search: {
    borderRadius: 16,
    elevation: 0,
  },
  hint: {
    marginTop: 6,
    marginBottom: spacing.md,
  },
  result: {
    marginBottom: spacing.md,
  },
  resultLabel: {
    marginBottom: 6,
  },
  footer: {
    marginVertical: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 18,
  },
});
