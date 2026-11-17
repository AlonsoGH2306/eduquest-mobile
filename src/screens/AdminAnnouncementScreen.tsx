import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Screen } from '../components/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { FormField } from '../components/FormField';
import { sendAnnouncement } from '../services/adminService';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

type Audience = 'ALL' | 'USER';

const TITLE_MAX = 100;
const MESSAGE_MAX = 1000;

export function AdminAnnouncementScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [audience, setAudience] = useState<Audience>('ALL');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const cleanUsername = username.trim().replace(/^@/, '');
  const usernameError = audience === 'USER' && !cleanUsername ? 'Indica a quién va dirigido.' : null;
  const titleError = title.trim().length < 3 ? 'El título debe tener al menos 3 caracteres.' : null;
  const messageError = !message.trim() ? 'Escribe el mensaje del aviso.' : null;

  const submit = async () => {
    setTouched(true);
    if (usernameError || titleError || messageError || sending) return;
    setSending(true);
    setServerError(null);
    try {
      const recipients = await sendAnnouncement({
        title: title.trim(),
        message: message.trim(),
        username: audience === 'USER' ? cleanUsername : undefined,
      });
      showToast(recipients === 1 ? 'Aviso enviado a 1 persona' : `Aviso enviado a ${recipients} personas`, 'success');
      setTitle('');
      setMessage('');
      setTouched(false);
    } catch (err) {
      const fields = getFieldErrors(err);
      setServerError(Object.values(fields)[0] ?? getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <ScreenTitle title="Enviar aviso" subtitle="Llega a la campana de notificaciones en la web y en la app." />

      <SegmentedButtons
        value={audience}
        onValueChange={(value) => setAudience(value as Audience)}
        buttons={[
          { value: 'ALL', label: 'Todos', icon: 'account-group-outline' },
          { value: 'USER', label: 'Un usuario', icon: 'account-outline' },
        ]}
        style={styles.segment}
      />

      {audience === 'USER' ? (
        <FormField
          label="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          error={touched ? (usernameError ?? undefined) : undefined}
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="at" />}
        />
      ) : null}

      <FormField
        label="Título"
        value={title}
        onChangeText={setTitle}
        maxLength={TITLE_MAX}
        error={touched ? (titleError ?? undefined) : undefined}
      />
      <FormField
        label="Mensaje"
        value={message}
        onChangeText={setMessage}
        maxLength={MESSAGE_MAX}
        multiline
        numberOfLines={5}
        error={touched ? (messageError ?? undefined) : undefined}
        hint={`${message.length}/${MESSAGE_MAX}`}
        style={styles.message}
      />

      {serverError ? (
        <Text variant="bodyMedium" style={[styles.error, { color: theme.colors.error }]}>
          {serverError}
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon="bullhorn-outline"
        onPress={submit}
        loading={sending}
        disabled={sending}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Enviar aviso
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    marginBottom: spacing.md,
  },
  message: {
    minHeight: 120,
  },
  error: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
