import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Poll } from '../types';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

interface PollCardProps {
  poll: Poll;
  currentUserId?: number;
  onVote: (pollId: number, optionId: number | null) => Promise<void>;
}

export function PollCard({ poll, currentUserId, onVote }: PollCardProps) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const myOption = poll.options.find((option) => currentUserId !== undefined && option.voterIds.includes(currentUserId));

  const vote = async (optionId: number) => {
    setBusy(true);
    try {
      await onVote(poll.id, myOption?.id === optionId ? null : optionId);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="poll" size={18} color={theme.colors.primary} />
        <Text variant="titleSmall" style={[styles.flex, { color: theme.colors.ink }]}>
          {poll.question}
        </Text>
      </View>
      {poll.options.map((option) => {
        const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
        const chosen = myOption?.id === option.id;
        return (
          <Pressable
            key={option.id}
            disabled={busy}
            onPress={() => vote(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: chosen, disabled: busy }}
            accessibilityLabel={`${option.text}, ${percent} por ciento`}
            style={[styles.option, { borderColor: chosen ? theme.colors.primary : theme.colors.outlineVariant }]}
          >
            <View
              style={[
                styles.bar,
                { width: `${percent}%`, backgroundColor: chosen ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
              ]}
            />
            <View style={styles.optionRow}>
              {chosen ? <MaterialCommunityIcons name="check" size={14} color={theme.colors.primary} /> : null}
              <Text variant="bodyMedium" style={[styles.flex, { color: theme.colors.onSurface }]}>
                {option.text}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.muted }}>
                {percent}%
              </Text>
            </View>
          </Pressable>
        );
      })}
      <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
        {poll.totalVotes === 1 ? '1 voto' : `${poll.totalVotes} votos`}
        {myOption ? ' · toca tu opción para quitar el voto' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.sm + 2,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 40,
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
