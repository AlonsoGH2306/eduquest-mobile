import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Group } from '../types';
import { GroupAvatar } from './GroupAvatar';
import { timeAgo } from '../utils/relativeTime';
import { BRAND, spacing, useAppTheme } from '../theme';

const describeUnread = (group: Group) => {
  const parts: string[] = [];
  const documents = group.unreadDocuments ?? 0;
  const sessions = group.unreadSessions ?? 0;
  if (documents > 0) parts.push(documents === 1 ? '1 material nuevo' : `${documents} materiales nuevos`);
  if (sessions > 0) parts.push(sessions === 1 ? '1 sesión nueva' : `${sessions} sesiones nuevas`);
  const messages = group.unreadMessages ?? 0;
  if (messages > 0) parts.push(messages === 1 ? '1 mensaje nuevo en el chat' : `${messages} mensajes nuevos en el chat`);
  return parts.join(' · ');
};

interface MyGroupRowProps {
  group: Group;
  onPress: (group: Group) => void;
  pinned?: boolean;
  onTogglePin?: (group: Group) => void;
}

function MyGroupRowComponent({ group, onPress, pinned = false, onTogglePin }: MyGroupRowProps) {
  const theme = useAppTheme();
  const unread = (group.unreadCount ?? 0) + (group.unreadMessages ?? 0);
  const mentions = group.unreadMentions ?? 0;
  const isPrivate = group.visibility === 'PRIVATE';

  return (
    <Pressable
      onPress={() => onPress(group)}
      onLongPress={onTogglePin ? () => onTogglePin(group) : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}${unread > 0 ? `, ${unread} novedades sin ver` : ''}${mentions > 0 ? `, ${mentions} menciones` : ''}${pinned ? ', fijado' : ''}`}
      accessibilityHint={onTogglePin ? (pinned ? 'Mantén presionado para desfijar' : 'Mantén presionado para fijar arriba') : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: unread > 0 ? theme.colors.primary : 'transparent',
        },
      ]}
    >
      <GroupAvatar group={group} size={50} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {pinned ? <MaterialCommunityIcons name="pin" size={14} color={theme.colors.primary} /> : null}
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.ink, fontWeight: unread > 0 ? '700' : '400' }]}
          >
            {group.name}
          </Text>
          <MaterialCommunityIcons name={isPrivate ? 'lock-outline' : 'earth'} size={14} color={theme.colors.muted} />
        </View>
        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={{ color: unread > 0 ? theme.colors.primary : theme.colors.muted, marginTop: 2 }}
        >
          {unread > 0
            ? describeUnread(group)
            : group.lastActivityAt
              ? `Última actividad ${timeAgo(group.lastActivityAt)}`
              : 'Sin actividad reciente'}
        </Text>
      </View>
      {mentions > 0 ? (
        <View style={[styles.badge, { backgroundColor: BRAND.chicle }]}>
          <Text variant="labelSmall" style={{ color: BRAND.noche, fontWeight: '700' }}>
            @{mentions > 99 ? '99+' : mentions}
          </Text>
        </View>
      ) : unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
      )}
    </Pressable>
  );
}

export const MyGroupRow = memo(MyGroupRowComponent);

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
