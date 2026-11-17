import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, IconButton, Portal, TextInput } from 'react-native-paper';
import { getErrorMessage } from '../utils/errors';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface CreatePollDialogProps {
  visible: boolean;
  onCreate: (question: string, options: string[]) => Promise<void>;
  onDismiss: () => void;
}

export function CreatePollDialog({ visible, onCreate, onDismiss }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuestion('');
    setOptions(['', '']);
    setTouched(false);
    setServerError(null);
  }, [visible]);

  const filled = options.map((option) => option.trim()).filter(Boolean);
  const questionError = question.trim().length < 3 ? 'La pregunta debe tener al menos 3 caracteres.' : null;
  const optionsError =
    new Set(filled.map((option) => option.toLowerCase())).size < MIN_OPTIONS ? 'Escribe al menos 2 opciones distintas.' : null;

  const updateOption = (index: number, value: string) =>
    setOptions((current) => current.map((option, position) => (position === index ? value : option)));

  const create = async () => {
    setTouched(true);
    if (questionError || optionsError || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onCreate(question.trim(), filled);
      onDismiss();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Nueva encuesta</Dialog.Title>
        <Dialog.ScrollArea style={styles.scroll}>
          <View style={styles.content}>
            <TextInput mode="outlined" label="Pregunta" value={question} onChangeText={setQuestion} maxLength={200} />
            <HelperText type="error" visible={touched && Boolean(questionError)} padding="none">
              {questionError}
            </HelperText>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  mode="outlined"
                  dense
                  label={`Opción ${index + 1}`}
                  value={option}
                  onChangeText={(value) => updateOption(index, value)}
                  maxLength={100}
                  style={styles.flex}
                />
                {options.length > MIN_OPTIONS ? (
                  <IconButton
                    icon="close"
                    size={18}
                    accessibilityLabel={`Quitar opción ${index + 1}`}
                    onPress={() => setOptions((current) => current.filter((_, position) => position !== index))}
                  />
                ) : null}
              </View>
            ))}
            <HelperText type="error" visible={touched && Boolean(optionsError)} padding="none">
              {optionsError}
            </HelperText>
            {options.length < MAX_OPTIONS ? (
              <Button icon="plus" mode="text" onPress={() => setOptions((current) => [...current, ''])} style={styles.add}>
                Agregar opción
              </Button>
            ) : null}
            {serverError ? (
              <HelperText type="error" visible padding="none">
                {serverError}
              </HelperText>
            ) : null}
          </View>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button onPress={create} loading={saving} disabled={saving}>
            Publicar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 460,
  },
  content: {
    paddingVertical: 8,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  add: {
    alignSelf: 'flex-start',
  },
});
