import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import type { Availability } from '../types';
import { AVAILABILITY_OPTIONS, STATUS_EMOJIS } from '../utils/availability';

interface StatusDialogProps {
  visible: boolean;
  availability: Availability;
  statusText: string;
  statusEmoji: string;
  onSave: (payload: { availability: Availability; statusText?: string; statusEmoji?: string }) => Promise<void>;
  onDismiss: () => void;
}

const MAX_TEXT = 80;

export function StatusDialog({ visible, availability, statusText, statusEmoji, onSave, onDismiss }: StatusDialogProps) {
  const [mode, setMode] = useState<Availability>(availability);
  const [text, setText] = useState(statusText);
  const [emoji, setEmoji] = useState(statusEmoji);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode(availability);
    setText(statusText);
    setEmoji(statusEmoji);
  }, [visible, availability, statusText, statusEmoji]);

  const save = async (clear = false) => {
    setSaving(true);
    try {
      await onSave({
        availability: mode,
        statusText: clear ? undefined : text.trim() || undefined,
        statusEmoji: clear ? undefined : emoji || undefined,
      });
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Tu estado</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <View style={styles.chips}>
            {AVAILABILITY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={mode === option.value}
                onPress={() => setMode(option.value)}
                icon={() => <View style={[styles.dot, { backgroundColor: option.color }]} />}
              >
                {option.label}
              </Chip>
            ))}
          </View>
          <Text variant="bodySmall">Invisible: apareces desconectado para los demás.</Text>
          <View style={styles.chips}>
            {STATUS_EMOJIS.map((item) => (
              <Chip
                key={item}
                compact
                selected={emoji === item}
                onPress={() => setEmoji(emoji === item ? '' : item)}
                accessibilityLabel={`Emoji ${item}`}
              >
                {item}
              </Chip>
            ))}
          </View>
          <TextInput
            mode="outlined"
            label="¿Qué estás haciendo?"
            placeholder="Repasando cálculo para el parcial"
            value={text}
            onChangeText={setText}
            maxLength={MAX_TEXT}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => save(true)} disabled={saving}>
            Borrar estado
          </Button>
          <Button onPress={() => save()} loading={saving} disabled={saving}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
