import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { spacing, useAppTheme } from '../theme';

interface JoinPasswordDialogProps {
  visible: boolean;
  groupName: string;
  password: string;
  error: string | null;
  joining: boolean;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
}

export function JoinPasswordDialog({
  visible,
  groupName,
  password,
  error,
  joining,
  onChangePassword,
  onSubmit,
  onDismiss,
}: JoinPasswordDialogProps) {
  const theme = useAppTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={joining ? undefined : onDismiss}>
        <Dialog.Icon icon="lock-outline" />
        <Dialog.Title style={styles.title}>Grupo privado</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
            Escribe la contraseña de «{groupName}». Si no la tienes, pídesela a quien creó el grupo.
          </Text>
          <TextInput
            mode="outlined"
            label="Contraseña del grupo"
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry={hidden}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            error={Boolean(error)}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
            right={
              <TextInput.Icon
                icon={hidden ? 'eye-outline' : 'eye-off-outline'}
                onPress={() => setHidden((value) => !value)}
                accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              />
            }
          />
          <HelperText type="error" visible={Boolean(error)} padding="none">
            {error ?? ' '}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={joining}>
            Cancelar
          </Button>
          <Button mode="contained" onPress={onSubmit} loading={joining} disabled={joining || !password}>
            Unirme
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
  },
  intro: {
    marginBottom: spacing.md,
  },
});
