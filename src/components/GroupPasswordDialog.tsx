import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { getErrorMessage } from '../utils/errors';

interface GroupPasswordDialogProps {
  visible: boolean;
  onSave: (password: string) => Promise<void>;
  onDismiss: () => void;
}

export function GroupPasswordDialog({ visible, onSave, onDismiss }: GroupPasswordDialogProps) {
  const theme = useAppTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setConfirm('');
      setShowPassword(false);
      setTouched(false);
      setServerError(null);
    }
  }, [visible]);

  const error =
    password.length < 4
      ? 'Usa al menos 4 caracteres.'
      : password.length > 50
        ? 'Máximo 50 caracteres.'
        : password !== confirm
          ? 'Las contraseñas no coinciden.'
          : null;

  const save = async () => {
    setTouched(true);
    if (error || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSave(password);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eye = (
    <TextInput.Icon
      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
      onPress={() => setShowPassword((value) => !value)}
      accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    />
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Icon icon="key-variant" />
        <Dialog.Title style={{ textAlign: 'center' }}>Nueva contraseña del grupo</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            La contraseña se guarda cifrada y nadie puede verla, ni siquiera tú. Si la olvidaste, ponle una nueva: los
            miembros actuales no se ven afectados.
          </Text>
          <TextInput
            mode="outlined"
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            right={eye}
            maxLength={50}
          />
          <TextInput
            mode="outlined"
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              setTouched(true);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={{ marginTop: 8 }}
            maxLength={50}
            error={touched && Boolean(error)}
          />
          <HelperText type="error" visible={touched && Boolean(error || serverError)} padding="none">
            {error ?? serverError}
          </HelperText>
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
