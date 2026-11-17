import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Searchbar, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, UserSummary } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth, useToast } from '../hooks/useContexts';
import { searchUsers } from '../services/messageService';
import { createRoom, getRoom, updateRoom } from '../services/roomService';
import { UserAvatar } from '../components/UserAvatar';
import { screenPadding } from '../components/Screen';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateRoom'>;

const MAX_MEMBERS = 9;

export function CreateRoomScreen({ route, navigation }: Props) {
  const roomId = route.params?.roomId;
  const editing = roomId !== undefined;
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [existing, setExisting] = useState<UserSummary[]>([]);
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim().replace(/^@/, ''), 300);
  const [results, setResults] = useState<UserSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const total = existing.length + selected.length;

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar chat grupal' : 'Nuevo chat grupal' });
    if (!editing) return;
    const controller = new AbortController();
    getRoom(roomId, controller.signal)
      .then((room) => {
        setName(room.name);
        setExisting(room.members.filter((member) => member.id !== user?.id));
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'));
    return () => controller.abort();
  }, [editing, roomId, navigation, user?.id, showToast]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    searchUsers(query, controller.signal)
      .then(setResults)
      .catch(() => setResults([]));
    return () => controller.abort();
  }, [query]);

  const taken = new Set([user?.id, ...existing.map((member) => member.id), ...selected.map((member) => member.id)]);
  const candidates = results.filter((candidate) => !taken.has(candidate.id));

  const add = (candidate: UserSummary) => {
    if (total >= MAX_MEMBERS) return;
    setSelected((current) => [...current, candidate]);
    setSearch('');
  };

  const nameError = name.trim().length === 0 ? 'Ponle un nombre al chat' : null;
  const membersError = !editing && selected.length < 2 ? 'Elige al menos 2 personas' : null;

  const save = async () => {
    if (nameError || membersError) return;
    setSaving(true);
    try {
      if (editing) {
        await updateRoom(roomId, { name: name.trim(), addMemberIds: selected.map((member) => member.id) });
        showToast('Chat actualizado', 'success');
        navigation.goBack();
      } else {
        const room = await createRoom(name.trim(), selected.map((member) => member.id));
        navigation.replace('RoomChat', { roomId: room.id, name: room.name });
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={screenPadding}
      keyboardShouldPersistTaps="handled"
      data={candidates}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.header}>
          <TextInput mode="outlined" label="Nombre del chat" value={name} onChangeText={setName} maxLength={60} />
          <Text variant="titleSmall">
            Integrantes ({total + 1} de {MAX_MEMBERS + 1})
          </Text>
          <View style={styles.chips}>
            {existing.map((member) => (
              <Chip key={member.id} icon="account">
                @{member.username}
              </Chip>
            ))}
            {selected.map((member) => (
              <Chip
                key={member.id}
                icon="account-plus"
                onClose={() => setSelected((current) => current.filter((item) => item.id !== member.id))}
              >
                @{member.username}
              </Chip>
            ))}
          </View>
          {membersError ? (
            <HelperText type="info" padding="none">
              {membersError}
            </HelperText>
          ) : null}
          <Searchbar
            placeholder="Añadir por @usuario"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            editable={total < MAX_MEMBERS}
          />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => add(item)}
          accessibilityRole="button"
          accessibilityLabel={`Añadir a ${item.username}`}
          style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
        >
          <UserAvatar username={item.username} avatarUrl={item.avatarUrl} size={36} />
          <Text variant="bodyLarge" style={{ color: theme.colors.ink }}>
            @{item.username}
          </Text>
        </Pressable>
      )}
      ListFooterComponent={
        <Button
          mode="contained"
          style={styles.save}
          onPress={save}
          loading={saving}
          disabled={saving || Boolean(nameError) || Boolean(membersError)}
        >
          {editing ? 'Guardar cambios' : 'Crear chat'}
        </Button>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  save: {
    marginTop: spacing.md,
  },
});
