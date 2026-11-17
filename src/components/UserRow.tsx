import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile } from '../types';
import { primaryRole, roleLabel, RoleName } from '../utils/roles';
import { UserAvatar } from './UserAvatar';
import { spacing, useAppTheme } from '../theme';

interface UserRowProps {
  user: UserProfile;
  isCurrentUser: boolean;
  editable: boolean;
  onPress: (user: UserProfile) => void;
  onToggleBan?: (user: UserProfile) => void;
}

function UserRowComponent({ user, isCurrentUser, editable, onPress, onToggleBan }: UserRowProps) {
  const theme = useAppTheme();
  const role = primaryRole(user.roles);
  const canModerate = Boolean(onToggleBan) && role !== 'ROLE_ADMIN';
  const banLabel = user.bannedUntil ? 'Suspendido' : 'Vetado';

  const badgeColors: Record<RoleName, { background: string; text: string }> = {
    ROLE_ADMIN: { background: theme.colors.highlight, text: theme.colors.onHighlight },
    ROLE_MANAGER: { background: theme.colors.secondaryContainer, text: theme.colors.onSecondaryContainer },
    ROLE_USER: { background: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant },
  };
  const badge = user.banned
    ? { background: theme.colors.errorContainer, text: theme.colors.error }
    : badgeColors[role];

  return (
    <Pressable
      onPress={() => onPress(user)}
      disabled={!editable}
      accessibilityRole={editable ? 'button' : 'text'}
      accessibilityLabel={`${user.username}, ${user.banned ? 'cuenta vetada' : roleLabel(role)}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={44} />
      <View style={styles.body}>
        <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.ink }}>
          @{user.username}
          {isCurrentUser ? <Text style={{ color: theme.colors.muted }}> (tú)</Text> : null}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={{ color: user.banned ? theme.colors.error : theme.colors.muted }}>
          {user.banned ? `${banLabel}: ${user.banReason ?? 'sin motivo'}` : user.email}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: badge.background }]}>
        <Text variant="labelMedium" style={{ color: badge.text }}>
          {user.banned ? banLabel : roleLabel(role)}
        </Text>
      </View>
      {canModerate && onToggleBan ? (
        <IconButton
          icon={user.banned ? 'account-check-outline' : 'account-cancel-outline'}
          iconColor={user.banned ? theme.colors.primary : theme.colors.error}
          size={22}
          onPress={() => onToggleBan(user)}
          accessibilityLabel={user.banned ? `Quitar el veto a ${user.username}` : `Vetar a ${user.username}`}
          style={styles.banButton}
        />
      ) : editable ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.muted} />
      ) : null}
    </Pressable>
  );
}

export const UserRow = memo(UserRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  body: {
    flex: 1,
  },
  banButton: {
    margin: 0,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
