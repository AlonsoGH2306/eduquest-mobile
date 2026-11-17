import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FormField } from './FormField';
import { submitAppeal } from '../services/authService';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

export function AppealCard() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);

  const messageError = touched && message.trim().length < 20 ? 'Escribe al menos 20 caracteres' : undefined;

  const send = async () => {
    setTouched(true);
    if (!username.trim() || !password || message.trim().length < 20) return;
    setSending(true);
    try {
      await submitAppeal(username.trim(), password, message.trim());
      setSent(true);
      showToast('Enviamos tu apelación a la moderación', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Text variant="bodyMedium" style={[styles.sent, { color: theme.colors.primary }]}>
        Recibimos tu apelación. Te avisaremos por correo cuando la moderación la revise.
      </Text>
    );
  }

  if (!open) {
    return (
      <Button mode="outlined" icon="scale-balance" onPress={() => setOpen(true)} style={styles.toggle}>
        ¿Crees que es un error? Apelar
      </Button>
    );
  }

  return (
    <View style={[styles.card, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.ink, marginBottom: spacing.sm }}>
        Apelar la suspensión
      </Text>
      <FormField
        label="Nombre de usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoComplete="username"
        error={touched && !username.trim() ? 'Ingresa tu nombre de usuario' : undefined}
      />
      <FormField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        error={touched && !password ? 'Ingresa tu contraseña' : undefined}
      />
      <FormField
        label="Tu explicación"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        maxLength={1000}
        error={messageError}
      />
      <View style={styles.actions}>
        <Button onPress={() => setOpen(false)}>Cancelar</Button>
        <Button mode="contained" icon="send" onPress={send} loading={sending} disabled={sending}>
          Enviar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: spacing.lg,
    borderRadius: 14,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  sent: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
