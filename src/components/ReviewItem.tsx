import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import type { Review } from '../types';
import { formatDate } from '../utils/format';
import { spacing, useAppTheme } from '../theme';
import { RatingInput } from './RatingInput';

interface ReviewItemProps {
  review: Review;
  isOwner: boolean;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
}

export function ReviewItem({ review, isOwner, onEdit, onDelete }: ReviewItemProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.item, { borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
            @{review.authorUsername}
            {isOwner ? ' (tú)' : ''}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            {formatDate(review.createdAt)}
          </Text>
        </View>
        {isOwner ? (
          <View style={styles.actions}>
            <IconButton icon="pencil-outline" size={20} onPress={() => onEdit(review)} accessibilityLabel="Editar mi reseña" />
            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => onDelete(review)}
              accessibilityLabel="Eliminar mi reseña"
            />
          </View>
        ) : null}
      </View>
      <RatingInput value={review.rating} size={16} />
      {review.comment ? (
        <Text variant="bodyMedium" style={[styles.comment, { color: theme.colors.onSurface }]}>
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  comment: {
    marginTop: 4,
  },
});
