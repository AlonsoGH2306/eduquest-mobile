import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DocumentItem } from '../types';
import { formatDate } from '../utils/format';
import { spacing, useAppTheme } from '../theme';
import { useSavedDocuments } from '../hooks/useContexts';
import { TagList } from './TagList';

interface DocumentRowProps {
  document: DocumentItem;
  onPress: (document: DocumentItem) => void;
  onPressTag?: (tag: string) => void;
}

const iconForUrl = (url: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'file-pdf-box';
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('github')) return 'github';
  if (lower.includes('drive.google') || lower.includes('docs.google')) return 'google-drive';
  return 'file-document-outline';
};

function DocumentRowComponent({ document, onPress, onPressTag }: DocumentRowProps) {
  const theme = useAppTheme();
  const { isSaved } = useSavedDocuments();

  return (
    <Pressable
      onPress={() => onPress(document)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${document.title}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={iconForUrl(document.fileUrl)} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="titleMedium" numberOfLines={2} style={[styles.title, { color: theme.colors.ink }]}>
            {document.title}
          </Text>
          {document.featured ? (
            <MaterialCommunityIcons name="star-four-points" size={18} color={theme.colors.warning} accessibilityLabel="Destacado" />
          ) : null}
          {isSaved(document.id) ? (
            <MaterialCommunityIcons name="bookmark" size={18} color={theme.colors.warning} accessibilityLabel="Guardado" />
          ) : null}
        </View>
        {document.course ? (
          <Text variant="labelMedium" numberOfLines={1} style={{ color: theme.colors.primary, marginTop: 2 }}>
            {document.course}
            {document.university ? ` · ${document.university}` : ''}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: 2 }}>
          @{document.authorUsername}, {formatDate(document.uploadedAt)}
          {document.groupName ? `  en ${document.groupName}` : ''}
        </Text>
        <TagList tags={document.tags ?? []} onPressTag={onPressTag} max={3} />
      </View>
    </Pressable>
  );
}

export const DocumentRow = memo(DocumentRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    flex: 1,
  },
});
