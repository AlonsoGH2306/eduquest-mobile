import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../theme';

interface TagListProps {
  tags: string[];
  onPressTag?: (tag: string) => void;
  max?: number;
}

export function TagList({ tags, onPressTag, max = 4 }: TagListProps) {
  const theme = useAppTheme();
  if (tags.length === 0) return null;
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((tag) => (
        <Pressable
          key={tag}
          disabled={!onPressTag}
          onPress={() => onPressTag?.(tag)}
          accessibilityRole={onPressTag ? 'button' : 'text'}
          accessibilityLabel={`Etiqueta ${tag}`}
          style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            #{tag}
          </Text>
        </Pressable>
      ))}
      {hidden > 0 ? (
        <Text variant="labelMedium" style={[styles.more, { color: theme.colors.muted }]}>
          +{hidden}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  more: {
    alignSelf: 'center',
  },
});
