import { Button, Dialog, List, Portal } from 'react-native-paper';
import { useAppTheme } from '../theme';

interface PhotoOptionsDialogProps {
  visible: boolean;
  hasPhoto: boolean;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onRemovePhoto: () => void;
  onDismiss: () => void;
}

export function PhotoOptionsDialog({
  visible,
  hasPhoto,
  onTakePhoto,
  onChooseFromGallery,
  onRemovePhoto,
  onDismiss,
}: PhotoOptionsDialogProps) {
  const theme = useAppTheme();

  const choose = (action: () => void) => () => {
    onDismiss();
    action();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Foto de perfil</Dialog.Title>
        <Dialog.Content>
          <List.Item
            title="Tomar una foto"
            description="Usa la cámara frontal"
            left={(props) => <List.Icon {...props} icon="camera-outline" color={theme.colors.primary} />}
            onPress={choose(onTakePhoto)}
          />
          <List.Item
            title="Elegir de la galería"
            description="Puedes recortarla antes de subirla"
            left={(props) => <List.Icon {...props} icon="image-multiple-outline" color={theme.colors.primary} />}
            onPress={choose(onChooseFromGallery)}
          />
          {hasPhoto ? (
            <List.Item
              title="Quitar foto"
              titleStyle={{ color: theme.colors.error }}
              description="Volverás a mostrar tus iniciales"
              left={(props) => <List.Icon {...props} icon="trash-can-outline" color={theme.colors.error} />}
              onPress={choose(onRemovePhoto)}
            />
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
