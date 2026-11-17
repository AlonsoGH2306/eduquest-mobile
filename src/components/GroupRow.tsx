import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Group } from '../types';
import { GroupAvatar } from './GroupAvatar';
import { spacing, useAppTheme } from '../theme';

const AVATAR_COLORS = ['#6a5af9', '#0d9488', '#ea580c', '#7c3aed', '#0369a1', '#be185d'];

export const colorForName = (name: string) => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '?';

interface GroupRowProps {
  group: Group;
  onPress: (group: Group) => void;
  onJoin?: (group: Group) => void;
  joining?: boolean;
}

function GroupRowComponent({ group, onPress, onJoin, joining = false }: GroupRowProps) {
  const theme = useAppTheme();
  const isPrivate = group.visibility === 'PRIVATE';
  const members = group.memberCount === 1 ? '1 miembro' : `${group.memberCount} miembros`;

  return (
    <Pressable
      onPress={() => onPress(group)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir grupo ${group.name}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: 'transparent',
        },
      ]}
    >
      <GroupAvatar group={group} size={50} />
      <View style={styles.body}>
        <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.ink }}>
          {group.name}
        </Text>
        <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.muted, marginTop: 2 }}>
          {group.description || (group.creatorUsername ? `Creado por @${group.creatorUsername}` : 'Grupo de estudio')}
        </Text>
        <View style={styles.meta}>
          <View
            style={[
              styles.badge,
              { backgroundColor: isPrivate ? theme.colors.primaryContainer : theme.colors.mintSoft },
            ]}
          >
            <MaterialCommunityIcons
              name={isPrivate ? 'lock-outline' : 'earth'}
              size={12}
              color={isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk}
            />
            <Text
              variant="labelSmall"
              style={{ color: isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk }}
            >
              {isPrivate ? 'Privado' : 'Público'}
            </Text>
          </View>
          <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
            {members} · #{group.code}
          </Text>
        </View>
      </View>
      {!group.member && onJoin ? (
        <Button
          mode="contained-tonal"
          compact
          icon={isPrivate ? 'lock-open-variant-outline' : undefined}
          onPress={() => onJoin(group)}
          loading={joining}
          disabled={joining}
        >
          Unirse
        </Button>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
      )}
    </Pressable>
  );
}

export const GroupRow = memo(GroupRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  body: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
