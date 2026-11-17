import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import { getErrorMessage, getErrorStatus, getFieldErrors } from '../utils/errors';

interface EditUsernameDialogProps {
  visible: boolean;
  currentUsername: string;
  onSave: (username: string) => Promise<void>;
  onDismiss: () => void;
}

const validate = (value: string, current: string): string | null => {
  const name = value.trim();
  if (name.length < 3 || name.length > 50) return 'Debe tener entre 3 y 50 caracteres.';
  if (name === current) return 'Escribe un nombre distinto al actual.';
  return null;
};

export function EditUsernameDialog({ visible, currentUsername, onSave, onDismiss }: EditUsernameDialogProps) {
  const [value, setValue] = useState(currentUsername);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(currentUsername);
      setTouched(false);
      setServerError(null);
    }
  }, [visible, currentUsername]);

  const validationError = validate(value, currentUsername);
  const error = serverError ?? (touched ? validationError : null);

  const save = async () => {
    setTouched(true);
    if (validationError || saving) return;
    setSaving(true);
    try {
      await onSave(value.trim());
      onDismiss();
    } catch (err) {
      setServerError(
        getErrorStatus(err) === 409
          ? 'Ese nombre ya lo usa otra persona.'
          : getFieldErrors(err).username ?? getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Cambiar nombre de usuario</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Nuevo nombre"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setTouched(true);
              setServerError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
            error={Boolean(error)}
            left={<TextInput.Affix text="@" />}
            onSubmitEditing={save}
          />
          <HelperText type={error ? 'error' : 'info'} visible padding="none">
            {error ?? 'Lo usarás para iniciar sesión. Tus compañeros lo verán en tus apuntes y reseñas.'}
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
