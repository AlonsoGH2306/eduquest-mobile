import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import type { StudySession } from '../types';
import { RatingInput } from './RatingInput';
import { useAppTheme } from '../theme';

const MAX_COMMENT = 500;

interface SessionReviewDialogProps {
  session: StudySession | null;
  saving: boolean;
  onSubmit: (session: StudySession, rating: number, comment: string) => void;
  onDismiss: () => void;
}

export function SessionReviewDialog({ session, saving, onSubmit, onDismiss }: SessionReviewDialogProps) {
  const theme = useAppTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setRating(0);
    setComment('');
    setTouched(false);
  }, [session?.id]);

  const submit = () => {
    setTouched(true);
    if (!session || rating < 1 || saving) return;
    onSubmit(session, rating, comment.trim());
  };

  return (
    <Portal>
      <Dialog visible={Boolean(session)} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title style={styles.centered}>¿Qué tal estuvo la asesoría?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={[styles.centered, { color: theme.colors.onSurfaceVariant }]}>
            {session?.title}
          </Text>
          <RatingInput value={rating} onChange={setRating} size={34} />
          <HelperText type="error" visible={touched && rating < 1} style={styles.centered}>
            Elige de 1 a 5 estrellas.
          </HelperText>
          <TextInput
            mode="outlined"
            label="Comentario (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={MAX_COMMENT}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button mode="contained" onPress={submit} loading={saving} disabled={saving}>
            Enviar
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
});
