import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GroupMember } from '../types';
import { UserAvatar } from './UserAvatar';
import { useOpenProfile } from '../hooks/useOpenProfile';
import { availabilityColor, availabilityLabel } from '../utils/availability';
import { spacing, useAppTheme } from '../theme';

interface MemberRowProps {
  member: GroupMember;
  isCurrentUser: boolean;
  onReport?: (member: GroupMember) => void;
  onMessage?: (member: GroupMember) => void;
  onRemove?: (member: GroupMember) => void;
  onToggleModerator?: (member: GroupMember) => void;
  online?: boolean;
}

const ROLE_LABEL: Record<GroupMember['groupRole'], string> = {
  CREATOR: 'Creador',
  MODERATOR: 'Moderador',
  MEMBER: 'Miembro',
};

const ROLE_DESCRIPTION: Record<GroupMember['groupRole'], string> = {
  CREATOR: 'Creó este grupo',
  MODERATOR: 'Ayuda a moderar el grupo',
  MEMBER: 'Integrante del grupo',
};

function MemberRowComponent({
  member,
  isCurrentUser,
  onReport,
  onMessage,
  onRemove,
  onToggleModerator,
  online,
}: MemberRowProps) {
  const theme = useAppTheme();
  const isCreator = member.groupRole === 'CREATOR';
  const isModerator = member.groupRole === 'MODERATOR';
  const openProfile = useOpenProfile();
  const canModerate = Boolean(onToggleModerator) && !isCurrentUser && !isCreator;
  const canMessage = Boolean(onMessage) && !isCurrentUser;
  const canRemove = Boolean(onRemove) && !isCurrentUser && !isCreator;
  const canReport = Boolean(onReport) && !isCurrentUser;
  const hasActions = canModerate || canMessage || canRemove || canReport;

  return (
    <View
      style={[styles.row, { backgroundColor: theme.colors.surface }]}
      accessibilityLabel={`${member.username}, ${ROLE_LABEL[member.groupRole].toLowerCase()}${online ? ', en línea' : ''}`}
    >
      <View style={styles.top}>
        <Pressable
          onPress={() => openProfile(member.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${member.username}`}
          style={styles.profile}
        >
          <View>
            <UserAvatar username={member.username} avatarUrl={member.avatarUrl} size={46} />
            {online !== undefined ? (
              <View
                style={[
                  styles.presence,
                  { borderColor: theme.colors.surface, backgroundColor: availabilityColor(member.availability, online) },
                ]}
              />
            ) : null}
          </View>
          <View style={styles.body}>
            <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.ink }}>
              @{member.username}
              {isCurrentUser ? <Text style={{ color: theme.colors.muted }}> (tú)</Text> : null}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              {ROLE_DESCRIPTION[member.groupRole]}
              {online ? (
                <Text style={{ color: availabilityColor(member.availability) }}> · {availabilityLabel(member.availability).toLowerCase()}</Text>
              ) : null}
              {member.advisor ? <Text style={{ color: theme.colors.warning }}> · Asesor</Text> : null}
            </Text>
            {member.statusText || member.statusEmoji ? (
              <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.ink }}>
                {[member.statusEmoji, member.statusText].filter(Boolean).join(' ')}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isCreator
                ? theme.colors.highlight
                : isModerator
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
            },
          ]}
        >
          {isCreator || isModerator ? (
            <MaterialCommunityIcons
              name={isCreator ? 'crown-outline' : 'shield-outline'}
              size={14}
              color={isCreator ? theme.colors.onHighlight : theme.colors.onPrimaryContainer}
            />
          ) : null}
          <Text
            variant="labelMedium"
            style={{
              color: isCreator
                ? theme.colors.onHighlight
                : isModerator
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant,
            }}
          >
            {ROLE_LABEL[member.groupRole]}
          </Text>
        </View>
      </View>
      {hasActions ? (
        <View style={[styles.actions, { borderTopColor: theme.colors.outlineVariant }]}>
          {canModerate && onToggleModerator ? (
            <IconButton
              icon={isModerator ? 'shield-off-outline' : 'shield-check-outline'}
              size={18}
              onPress={() => onToggleModerator(member)}
              accessibilityLabel={isModerator ? `Quitar moderación a ${member.username}` : `Nombrar moderador a ${member.username}`}
              style={styles.action}
            />
          ) : null}
          {canMessage && onMessage ? (
            <IconButton
              icon="message-text-outline"
              size={18}
              onPress={() => onMessage(member)}
              accessibilityLabel={`Enviar mensaje a ${member.username}`}
              style={styles.action}
            />
          ) : null}
          {canRemove && onRemove ? (
            <IconButton
              icon="account-remove-outline"
              size={18}
              iconColor={theme.colors.error}
              onPress={() => onRemove(member)}
              accessibilityLabel={`Quitar a ${member.username} del grupo`}
              style={styles.action}
            />
          ) : null}
          {canReport && onReport ? (
            <IconButton
              icon="flag-outline"
              size={18}
              onPress={() => onReport(member)}
              accessibilityLabel={`Reportar a ${member.username}`}
              style={styles.action}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const MemberRow = memo(MemberRowComponent);

const styles = StyleSheet.create({
  row: {
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  body: {
    flex: 1,
  },
  action: {
    margin: 0,
  },
  presence: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
