import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, useAppTheme } from '../theme';

type Block =
  | { kind: 'heading'; text: string; level: number }
  | { kind: 'step'; text: string; marker: string; index: number }
  | { kind: 'paragraph'; text: string }
  | { kind: 'divider' };

const cleanInline = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').trim();

const cleanStep = (text: string) => cleanInline(text.replace(/^(?:[-*•]\s+|\[[ xX]?\]\s*)+/, ''));

export const parsePlan = (content: string): Block[] => {
  let stepIndex = 0;
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map<Block>((line) => {
      if (/^([-*_])\1{2,}$/.test(line)) return { kind: 'divider' };
      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) return { kind: 'heading', level: heading[1].length, text: cleanInline(heading[2]) };
      const boldLine = line.match(/^\*\*(.+)\*\*:?$/);
      if (boldLine) return { kind: 'heading', level: 3, text: cleanInline(boldLine[1]) };
      const bullet = line.match(/^[-*•]\s+(\S.*)$/);
      if (bullet) return { kind: 'step', marker: '•', text: cleanStep(bullet[1]), index: stepIndex++ };
      const numbered = line.match(/^(\d+)[.)]\s+(\S.*)$/);
      if (numbered) return { kind: 'step', marker: `${numbered[1]}.`, text: cleanStep(numbered[2]), index: stepIndex++ };
      return { kind: 'paragraph', text: cleanInline(line) };
    });
};

interface PlanContentProps {
  content: string;
  completedSteps?: number[];
  onToggleStep?: (index: number) => void;
}

export function PlanContent({ content, completedSteps = [], onToggleStep }: PlanContentProps) {
  const theme = useAppTheme();
  const done = new Set(completedSteps);

  return (
    <View>
      {parsePlan(content).map((block, index) => {
        if (block.kind === 'divider') {
          return <View key={index} style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />;
        }
        if (block.kind === 'heading') {
          return (
            <Text
              key={index}
              variant={block.level <= 2 ? 'titleLarge' : 'titleMedium'}
              style={[styles.heading, { color: theme.colors.ink }]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.kind === 'step') {
          if (!onToggleStep) {
            return (
              <View key={index} style={styles.listRow}>
                <Text variant="bodyMedium" style={[styles.marker, { color: theme.colors.primary }]}>
                  {block.marker}
                </Text>
                <Text variant="bodyMedium" style={[styles.listText, { color: theme.colors.onSurface }]}>
                  {block.text}
                </Text>
              </View>
            );
          }
          const checked = done.has(block.index);
          return (
            <Pressable
              key={index}
              onPress={() => onToggleStep(block.index)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              style={styles.listRow}
              hitSlop={4}
            >
              <MaterialCommunityIcons
                name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                size={22}
                color={checked ? theme.colors.success : theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={[
                  styles.listText,
                  { color: checked ? theme.colors.muted : theme.colors.onSurface },
                  checked && styles.checkedText,
                ]}
              >
                {block.text}
              </Text>
            </Pressable>
          );
        }
        return (
          <Text key={index} variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurface }]}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  heading: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingRight: spacing.sm,
  },
  marker: {
    minWidth: 18,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    lineHeight: 22,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
  paragraph: {
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
