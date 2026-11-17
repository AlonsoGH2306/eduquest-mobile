import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, List, Searchbar, Text } from 'react-native-paper';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { GlobalSearchResult, HomeStackParamList, SearchHit, TabParamList } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useContexts';
import { globalSearch } from '../services/searchService';
import { getDocuments } from '../services/documentService';
import { UserAvatar } from '../components/UserAvatar';
import { StateView } from '../components/StateView';
import { screenPadding } from '../components/Screen';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'GlobalSearch'>,
  BottomTabScreenProps<TabParamList>
>;

export function GlobalSearchScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim(), 300);
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResult(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    globalSearch(query, controller.signal)
      .then((data) => {
        setResult(data);
        setError(null);
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  const openDocument = async (hit: SearchHit) => {
    try {
      const page = await getDocuments(0, 20, { search: hit.title });
      const document = page.content.find((item) => item.id === hit.id);
      if (document) navigation.navigate('DocumentDetail', { document });
      else showToast('Ese material ya no está disponible.', 'info');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const empty =
    result &&
    result.documents.length + result.groups.length + result.questions.length + result.users.length === 0;

  const section = (title: string, hits: SearchHit[], icon: string, onPress: (hit: SearchHit) => void) =>
    hits.length > 0 ? (
      <List.Section key={title}>
        <List.Subheader>{title}</List.Subheader>
        {hits.map((hit) => (
          <List.Item
            key={hit.id}
            title={hit.title}
            description={hit.subtitle ?? undefined}
            titleNumberOfLines={1}
            descriptionNumberOfLines={1}
            left={(props) => <List.Icon {...props} icon={icon} />}
            onPress={() => onPress(hit)}
            style={[styles.item, { backgroundColor: theme.colors.surface }]}
          />
        ))}
      </List.Section>
    ) : null;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={screenPadding}
      keyboardShouldPersistTaps="handled"
    >
      <Searchbar
        placeholder="Materiales, grupos, preguntas o personas"
        value={search}
        onChangeText={setSearch}
        autoFocus
        autoCorrect={false}
        accessibilityLabel="Búsqueda global"
      />
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? <StateView kind="error" compact title="No pudimos buscar" message={error} /> : null}
      {query.length < 2 && !loading ? (
        <Text variant="bodyMedium" style={[styles.hint, { color: theme.colors.muted }]}>
          Escribe al menos 2 letras para buscar en toda la app.
        </Text>
      ) : null}
      {empty && !loading ? (
        <StateView kind="empty" compact icon="magnify-close" title="Sin resultados" message={`Nada coincide con «${query}».`} />
      ) : null}
      {result && !loading ? (
        <View>
          {section('Materiales', result.documents, 'file-document-outline', openDocument)}
          {section('Grupos', result.groups, 'account-group-outline', (hit) =>
            navigation.navigate('Groups', { screen: 'GroupDetail', params: { groupId: hit.id } })
          )}
          {section('Foro', result.questions, 'forum-outline', (hit) => navigation.navigate('ForumThread', { questionId: hit.id }))}
          {result.users.length > 0 ? (
            <List.Section>
              <List.Subheader>Personas</List.Subheader>
              {result.users.map((person) => (
                <List.Item
                  key={person.id}
                  title={`@${person.username}`}
                  description={person.advisor ? 'Asesor' : undefined}
                  left={() => <UserAvatar username={person.username} avatarUrl={person.avatarUrl} size={36} />}
                  onPress={() => navigation.navigate('UserProfile', { userId: person.id })}
                  style={[styles.item, { backgroundColor: theme.colors.surface }]}
                />
              ))}
            </List.Section>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.lg,
  },
  hint: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  item: {
    borderRadius: 14,
    marginBottom: 6,
    paddingLeft: spacing.sm,
  },
});
