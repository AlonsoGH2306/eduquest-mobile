import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import type { UserProfile } from '../types';
import { spacing, useAppTheme } from '../theme';

const COMMON_REASONS = [
  'Spam o publicidad',
  'Material ofensivo o inapropiado',
  'Acoso a otros estudiantes',
  'Material con derechos de autor sin permiso',
];

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

const DURATIONS: { days: number | null; label: string; adminOnly?: boolean }[] = [
  { days: 1, label: '1 día' },
  { days: 3, label: '3 días' },
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días', adminOnly: true },
  { days: null, label: 'Permanente', adminOnly: true },
];

interface BanDialogProps {
  user: UserProfile | null;
  saving: boolean;
  allowPermanent: boolean;
  onConfirm: (user: UserProfile, reason: string, days: number | null) => void;
  onDismiss: () => void;
}

export function BanDialog({ user, saving, allowPermanent, onConfirm, onDismiss }: BanDialogProps) {
  const theme = useAppTheme();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [days, setDays] = useState<number | null>(3);

  useEffect(() => {
    setReason('');
    setTouched(false);
    setDays(3);
  }, [user?.id]);

  const trimmed = reason.trim();
  const error =
    trimmed.length < MIN_LENGTH
      ? `Explica qué norma incumplió (mínimo ${MIN_LENGTH} caracteres).`
      : trimmed.length > MAX_LENGTH
        ? `Máximo ${MAX_LENGTH} caracteres.`
        : null;

  const submit = () => {
    setTouched(true);
    if (!user || error || saving) return;
    onConfirm(user, trimmed, days);
  };

  return (
    <Portal>
      <Dialog visible={Boolean(user)} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Icon icon="account-cancel-outline" color={theme.colors.error} />
        <Dialog.Title style={styles.centered}>Suspender a @{user?.username}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
              No podrá entrar a EduQuest mientras dure la suspensión y verá este motivo al intentarlo.
            </Text>
            <View style={styles.chips}>
              {DURATIONS.filter((option) => allowPermanent || !option.adminOnly).map((option) => (
                <Chip
                  key={option.label}
                  compact
                  selected={days === option.days}
                  onPress={() => setDays(option.days)}
                  icon={days === option.days ? 'check' : 'clock-outline'}
                >
                  {option.label}
                </Chip>
              ))}
            </View>
            <View style={styles.chips}>
              {COMMON_REASONS.map((option) => (
                <Chip
                  key={option}
                  compact
                  selected={reason === option}
                  onPress={() => {
                    setReason(option);
                    setTouched(true);
                  }}
                >
                  {option}
                </Chip>
              ))}
            </View>
            <TextInput
              mode="outlined"
              label="Motivo"
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
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            onPress={submit}
            loading={saving}
            disabled={saving}
          >
            {days === null ? 'Vetar para siempre' : 'Suspender'}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
