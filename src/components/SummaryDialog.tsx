import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Text } from 'react-native-paper';
import { summarizeChannel } from '../services/groupService';
import type { ChannelSummary } from '../types';
import { getErrorMessage } from '../utils/errors';
import { RichText } from './RichText';
import { useAppTheme } from '../theme';

interface SummaryDialogProps {
  groupId: number;
  channelId: number | null;
  channelName: string;
  onDismiss: () => void;
}

export function SummaryDialog({ groupId, channelId, channelName, onDismiss }: SummaryDialogProps) {
  const theme = useAppTheme();
  const [summary, setSummary] = useState<ChannelSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channelId === null) return;
    let cancelled = false;
    setSummary(null);
    setError(null);
    summarizeChannel(groupId, channelId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, channelId]);

  return (
    <Portal>
      <Dialog visible={channelId !== null} onDismiss={onDismiss}>
        <Dialog.Title>Ponme al día · #{channelName}</Dialog.Title>
        <Dialog.ScrollArea style={styles.area}>
          <ScrollView contentContainerStyle={styles.content}>
            {error ? (
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            ) : !summary ? (
              <ActivityIndicator accessibilityLabel="Leyendo el canal" />
            ) : (
              <>
                <RichText content={summary.summary} color={theme.colors.onSurface} />
                <Text variant="labelSmall" style={[styles.note, { color: theme.colors.muted }]}>
                  {summary.generatedByAi ? 'Resumen generado con IA' : 'Resumen básico'} de {summary.messageCount}{' '}
                  {summary.messageCount === 1 ? 'mensaje' : 'mensajes'}.
                </Text>
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  area: {
    maxHeight: 420,
  },
  content: {
    paddingVertical: 12,
  },
  note: {
    marginTop: 12,
  },
});
