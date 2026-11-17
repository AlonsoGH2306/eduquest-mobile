import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { LeaderboardEntry } from '../types';
import { UserAvatar } from './UserAvatar';
import { useOpenProfile } from '../hooks/useOpenProfile';
import { FONTS, spacing, useAppTheme } from '../theme';

const MEDALS = ['#E0A100', '#9AA3B5', '#C27C4A'];

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currentUserId?: number;
}

export function LeaderboardList({ entries, currentUserId }: LeaderboardListProps) {
  const theme = useAppTheme();
  const openProfile = useOpenProfile();

  return (
    <View>
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        const medal = MEDALS[entry.position - 1];
        return (
          <Pressable
            key={entry.userId}
            onPress={() => openProfile(entry.userId)}
            accessibilityRole="button"
            style={[styles.row, isMe && { backgroundColor: theme.colors.primaryContainer }]}
            accessibilityLabel={`Puesto ${entry.position}, ${entry.username}, ${entry.points} puntos`}
          >
            <View style={[styles.position, { backgroundColor: medal ?? theme.colors.surfaceVariant }]}>
              <Text style={[styles.positionText, { color: medal ? '#FFFFFF' : theme.colors.onSurfaceVariant }]}>
                {entry.position}
              </Text>
            </View>
            <UserAvatar username={entry.username} avatarUrl={entry.avatarUrl} size={34} />
            <View style={styles.name}>
              <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.ink }}>
                @{entry.username}
              </Text>
              {entry.advisor ? (
                <Text variant="labelSmall" style={{ color: theme.colors.warning }}>
                  Asesor
                </Text>
              ) : null}
            </View>
            <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
              {entry.points} pts
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
  },
  position: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 13,
  },
  name: {
    flex: 1,
  },
});
