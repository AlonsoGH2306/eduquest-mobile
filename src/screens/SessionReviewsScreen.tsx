import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupsStackParamList, SessionReview } from '../types';
import * as groupService from '../services/groupService';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { RatingInput } from '../components/RatingInput';
import { UserAvatar } from '../components/UserAvatar';
import { formatDate } from '../utils/format';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'SessionReviews'>;

export function SessionReviewsScreen({ route }: Props) {
  const { groupId, session } = route.params;
  const theme = useAppTheme();
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    groupService
      .getSessionReviews(groupId, session.id, controller.signal)
      .then(setReviews)
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [groupId, session.id, reloadKey]);

  const average = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  return (
    <Screen>
      <Text variant="headlineSmall" style={{ color: theme.colors.ink }}>
        {session.title}
      </Text>
      {session.createdByUsername ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.muted, marginTop: 2 }}>
          Dictada por @{session.createdByUsername}
        </Text>
      ) : null}

      {average !== null ? (
        <View style={[styles.summary, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.average, { color: theme.colors.ink }]}>{average.toFixed(1)}</Text>
          <View>
            <RatingInput value={Math.round(average)} size={18} />
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              {reviews.length} {reviews.length === 1 ? 'calificación' : 'calificaciones'}
            </Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ListSkeleton count={3} avatar="circle" label="Cargando reseñas" />
      ) : error ? (
        <StateView kind="error" compact message={error} actionLabel="Reintentar" onAction={() => setReloadKey((key) => key + 1)} />
      ) : reviews.length === 0 ? (
        <StateView kind="empty" compact icon="star-outline" title="Sin reseñas todavía" />
      ) : (
        reviews.map((review) => (
          <View
            key={review.id}
            style={[styles.review, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
          >
            <UserAvatar username={review.authorUsername} avatarUrl={review.authorAvatarUrl} size={38} />
            <View style={styles.body}>
              <View style={styles.reviewHeader}>
                <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
                  @{review.authorUsername}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                  {formatDate(review.createdAt)}
                </Text>
              </View>
              <RatingInput value={review.rating} size={14} />
              {review.comment ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                  {review.comment}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    marginVertical: spacing.md,
  },
  average: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 36,
  },
  review: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  body: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
