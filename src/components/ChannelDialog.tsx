import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, HelperText, Portal, Switch, Text, TextInput } from 'react-native-paper';
import type { ChannelSettings, GroupChannel } from '../types';
import { getErrorMessage } from '../utils/errors';

interface ChannelDialogProps {
  visible: boolean;
  channel: GroupChannel | null;
  onSave: (settings: ChannelSettings) => Promise<void>;
  onDelete?: (channel: GroupChannel) => Promise<void>;
  onDismiss: () => void;
}

const SLOW_MODES = [
  { value: 0, label: 'No' },
  { value: 10, label: '10 s' },
  { value: 30, label: '30 s' },
  { value: 60, label: '1 min' },
  { value: 300, label: '5 min' },
];

export function ChannelDialog({ visible, channel, onSave, onDelete, onDismiss }: ChannelDialogProps) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [slowMode, setSlowMode] = useState(0);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(channel?.name ?? '');
    setTopic(channel?.topic ?? '');
    setReadOnly(channel?.readOnly ?? false);
    setSlowMode(channel?.slowModeSeconds ?? 0);
    setTouched(false);
    setServerError(null);
  }, [visible, channel]);

  const nameError = name.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : null;

  const run = async (task: () => Promise<void>) => {
    setSaving(true);
    setServerError(null);
    try {
      await task();
      onDismiss();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    setTouched(true);
    if (nameError || saving) return;
    void run(() => onSave({ name: name.trim(), topic: topic.trim() || undefined, readOnly, slowModeSeconds: slowMode }));
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>{channel ? 'Editar canal' : 'Nuevo canal'}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Nombre del canal"
            value={name}
            onChangeText={setName}
            maxLength={40}
            left={<TextInput.Affix text="#" />}
            autoCapitalize="none"
          />
          <HelperText type={touched && nameError ? 'error' : 'info'} visible padding="none">
            {touched && nameError ? nameError : 'Se guarda en minúsculas y con guiones.'}
          </HelperText>
          <TextInput mode="outlined" label="Tema (opcional)" value={topic} onChangeText={setTopic} maxLength={200} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text variant="bodyMedium">Canal de anuncios</Text>
              <Text variant="bodySmall">Solo el creador y los moderadores escriben</Text>
            </View>
            <Switch value={readOnly} onValueChange={setReadOnly} accessibilityLabel="Canal de anuncios" />
          </View>
          <Text variant="bodyMedium" style={styles.label}>
            Modo lento
          </Text>
          <View style={styles.chips}>
            {SLOW_MODES.map((option) => (
              <Chip key={option.value} compact selected={slowMode === option.value} onPress={() => setSlowMode(option.value)}>
                {option.label}
              </Chip>
            ))}
          </View>
          {serverError ? (
            <HelperText type="error" visible padding="none">
              {serverError}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          {channel && onDelete ? (
            <Button textColor="#C62828" onPress={() => void run(() => onDelete(channel))} disabled={saving}>
              Eliminar
            </Button>
          ) : null}
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button onPress={save} loading={saving} disabled={saving}>
            {channel ? 'Guardar' : 'Crear'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
