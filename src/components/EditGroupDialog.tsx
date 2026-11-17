import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import type { Group, GroupUpdateRequest } from '../types';
import { getErrorMessage } from '../utils/errors';

interface EditGroupDialogProps {
  group: Group | null;
  onSave: (payload: GroupUpdateRequest) => Promise<void>;
  onDismiss: () => void;
}

const DESCRIPTION_MAX = 500;

export function EditGroupDialog({ group, onSave, onDismiss }: EditGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? '');
      setTouched(false);
      setServerError(null);
    }
  }, [group]);

  const nameError = !name.trim() ? 'El grupo necesita un nombre.' : name.trim().length > 100 ? 'Máximo 100 caracteres.' : null;

  const save = async () => {
    setTouched(true);
    if (nameError || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={group !== null} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Editar grupo</Dialog.Title>
        <Dialog.Content>
          <TextInput mode="outlined" label="Nombre" value={name} onChangeText={setName} maxLength={100} />
          <HelperText type="error" visible={touched && Boolean(nameError)} padding="none">
            {nameError}
          </HelperText>
          <TextInput
            mode="outlined"
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            maxLength={DESCRIPTION_MAX}
            multiline
            numberOfLines={3}
          />
          {serverError ? (
            <HelperText type="error" visible padding="none">
              {serverError}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button onPress={save} loading={saving} disabled={saving}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
