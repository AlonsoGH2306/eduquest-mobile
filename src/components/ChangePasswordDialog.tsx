import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { PASSWORD_PATTERN } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';
import { useAppTheme } from '../theme';

interface ChangePasswordDialogProps {
  visible: boolean;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
  onForgot: () => void;
  onDismiss: () => void;
}

export function ChangePasswordDialog({ visible, onSave, onForgot, onDismiss }: ChangePasswordDialogProps) {
  const theme = useAppTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShow(false);
      setTouched(false);
      setServerError(null);
    }
  }, [visible]);

  const error = !current
    ? 'Escribe tu contraseña actual.'
    : next.length < 8
      ? 'La nueva contraseña necesita al menos 8 caracteres.'
      : !PASSWORD_PATTERN.test(next)
        ? 'Incluye al menos una letra y un número.'
        : next !== confirm
          ? 'Las contraseñas no coinciden.'
          : null;

  const save = async () => {
    setTouched(true);
    if (error || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSave(current, next);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eye = (
    <TextInput.Icon
      icon={show ? 'eye-off-outline' : 'eye-outline'}
      onPress={() => setShow((value) => !value)}
      accessibilityLabel={show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
    />
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Cambiar contraseña</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            Tu contraseña está cifrada y no se puede mostrar. Aquí la reemplazas por una nueva.
          </Text>
          <TextInput
            mode="outlined"
            dense
            label="Contraseña actual"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry={!show}
            autoCapitalize="none"
            right={eye}
          />
          <TextInput
            mode="outlined"
            dense
            label="Nueva contraseña"
            value={next}
            onChangeText={setNext}
            secureTextEntry={!show}
            autoCapitalize="none"
            style={{ marginTop: 8 }}
          />
          <TextInput
            mode="outlined"
            dense
            label="Confirmar nueva"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!show}
            autoCapitalize="none"
            style={{ marginTop: 8 }}
          />
          <HelperText type="error" visible={touched && Boolean(error || serverError)} padding="none">
            {error ?? serverError}
          </HelperText>
          <Button compact mode="text" onPress={onForgot} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            No recuerdo mi contraseña actual
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button mode="contained" onPress={save} loading={saving} disabled={saving}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
