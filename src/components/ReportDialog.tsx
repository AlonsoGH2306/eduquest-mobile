import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import type { ReportTargetType } from '../types';
import * as reportService from '../services/reportService';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

export interface ReportTarget {
  type: ReportTargetType;
  id: number;
  label: string;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

interface ReportDialogProps {
  target: ReportTarget | null;
  onDismiss: () => void;
}

export function ReportDialog({ target, onDismiss }: ReportDialogProps) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setReason('');
    setTouched(false);
  }, [target?.id, target?.type]);

  const trimmed = reason.trim();
  const error =
    trimmed.length < MIN_LENGTH
      ? `Cuéntanos el motivo (mínimo ${MIN_LENGTH} caracteres).`
      : trimmed.length > MAX_LENGTH
        ? `Máximo ${MAX_LENGTH} caracteres.`
        : null;

  const submit = async () => {
    setTouched(true);
    if (!target || error || sending) return;
    setSending(true);
    try {
      await reportService.createReport({ targetType: target.type, targetId: target.id, reason: trimmed });
      showToast('Gracias. El equipo de moderación revisará tu reporte.', 'success');
      onDismiss();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const subject = target?.type === 'USER' ? `@${target.label}` : `«${target?.label}»`;

  return (
    <Portal>
      <Dialog visible={Boolean(target)} onDismiss={sending ? undefined : onDismiss}>
        <Dialog.Icon icon="flag-outline" color={theme.colors.error} />
        <Dialog.Title style={styles.centered}>
          {target?.type === 'USER' ? 'Reportar usuario' : 'Reportar material'}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
              Estás reportando {subject}. Tu reporte es anónimo para la otra persona.
            </Text>
            <TextInput
              mode="outlined"
              label="¿Qué norma incumple?"
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setTouched(true);
              }}
              multiline
              numberOfLines={3}
              maxLength={MAX_LENGTH}
              error={touched && Boolean(error)}
            />
            <HelperText type={touched && error ? 'error' : 'info'} visible padding="none">
              {touched && error ? error : `${trimmed.length}/${MAX_LENGTH}`}
            </HelperText>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={sending}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            onPress={submit}
            loading={sending}
            disabled={sending}
          >
            Enviar reporte
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
  scrollArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  intro: {
    marginBottom: spacing.md,
  },
});
