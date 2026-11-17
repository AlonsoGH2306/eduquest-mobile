import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { getModeration, updateModeration } from '../services/groupService';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage, isCanceled } from '../utils/errors';

interface ModerationDialogProps {
  groupId: number;
  visible: boolean;
  onDismiss: () => void;
}

const MAX_WORDS = 50;

export function ModerationDialog({ groupId, visible, onDismiss }: ModerationDialogProps) {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const words = text
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    getModeration(groupId, controller.signal)
      .then((list) => setText(list.join(', ')))
      .catch((err) => {
        if (!isCanceled(err)) showToast(getErrorMessage(err), 'error');
      });
    return () => controller.abort();
  }, [groupId, visible, showToast]);

  const save = async () => {
    setSaving(true);
    try {
      await updateModeration(groupId, words);
      showToast('Filtro de palabras actualizado', 'success');
      onDismiss();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Moderación del chat</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall">Los mensajes con estas palabras se rechazan en todos los canales del grupo.</Text>
          <TextInput
            mode="outlined"
            label="Palabras prohibidas (separadas por comas)"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
            style={{ marginTop: 8 }}
          />
          <HelperText type={words.length > MAX_WORDS ? 'error' : 'info'} visible padding="none">
            {words.length} de {MAX_WORDS} palabras
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button onPress={save} loading={saving} disabled={saving || words.length > MAX_WORDS}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
