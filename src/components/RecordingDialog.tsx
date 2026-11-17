import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import type { StudySession } from '../types';
import { useAppTheme } from '../theme';

const YOUTUBE_URL = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/;

interface RecordingDialogProps {
  session: StudySession | null;
  saving: boolean;
  serverError: string | null;
  onSave: (session: StudySession, recordingUrl: string) => void;
  onDismiss: () => void;
}

export function RecordingDialog({ session, saving, serverError, onSave, onDismiss }: RecordingDialogProps) {
  const theme = useAppTheme();
  const [url, setUrl] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setUrl(session?.recordingUrl ?? '');
    setTouched(false);
  }, [session?.id, session?.recordingUrl]);

  const trimmed = url.trim();
  const error = trimmed && !YOUTUBE_URL.test(trimmed) ? 'Pega un enlace de YouTube (youtube.com o youtu.be).' : null;

  const save = (value: string) => {
    setTouched(true);
    if (!session || saving || (value && error)) return;
    onSave(session, value);
  };

  return (
    <Portal>
      <Dialog visible={Boolean(session)} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Icon icon="youtube" color={theme.colors.error} />
        <Dialog.Title>Grabación de la asesoría</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            Súbela a YouTube (puede ser “no listado”) y pega el enlace. Comprobamos que el video exista.
          </Text>
          <TextInput
            mode="outlined"
            label="Enlace de YouTube"
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              setTouched(true);
            }}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            error={touched && Boolean(error || serverError)}
          />
          <HelperText type="error" visible={touched && Boolean(error || serverError)} padding="none">
            {error ?? serverError}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          {session?.recordingUrl ? (
            <Button textColor={theme.colors.error} onPress={() => save('')} disabled={saving}>
              Quitar
            </Button>
          ) : null}
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button mode="contained" onPress={() => save(trimmed)} loading={saving} disabled={saving || !trimmed}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
