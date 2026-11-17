import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, SegmentedButtons, Text } from 'react-native-paper';
import type { Sticker } from '../types';
import { addSticker, getMyStickers, removeSticker } from '../services/stickerService';
import { uploadFile } from '../services/documentService';
import { useToast } from '../hooks/useContexts';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { packCode, STICKER_PACK } from '../utils/stickers';
import { StickerView } from './StickerView';
import { useAppTheme } from '../theme';

interface StickerSheetProps {
  visible: boolean;
  onPick: (sticker: string) => void;
  onDismiss: () => void;
}

const SIZE = 68;
const STICKER_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_STICKER_BYTES = 10 * 1024 * 1024;

export function StickerSheet({ visible, onPick, onDismiss }: StickerSheetProps) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'pack' | 'mine'>('pack');
  const [mine, setMine] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!visible || tab !== 'mine') return;
    const controller = new AbortController();
    setLoading(true);
    getMyStickers(controller.signal)
      .then(setMine)
      .catch((err) => {
        if (!isCanceled(err)) showToast(getErrorMessage(err), 'error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [visible, tab, showToast]);

  const pick = (value: string) => {
    onDismiss();
    onPick(value);
  };

  const createSticker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Activa el acceso a tus fotos para crear stickers.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!STICKER_TYPES.includes(mimeType)) {
      showToast('El sticker debe ser PNG, JPG, WEBP o GIF.', 'error');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_STICKER_BYTES) {
      showToast('El sticker no debe superar los 10 MB.', 'error');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName ?? `sticker.${mimeType.split('/')[1]}`,
        mimeType,
      });
      const sticker = await addSticker(uploaded.url);
      setMine((current) => [sticker, ...current]);
      showToast('Sticker guardado en tu colección', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (sticker: Sticker) => {
    try {
      await removeSticker(sticker.id);
      setMine((current) => current.filter((item) => item.id !== sticker.id));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Stickers</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <SegmentedButtons
            value={tab}
            onValueChange={(value) => setTab(value as 'pack' | 'mine')}
            buttons={[
              { value: 'pack', label: 'EduQuest' },
              { value: 'mine', label: 'Mis stickers' },
            ]}
          />
        </Dialog.Content>
        <Dialog.ScrollArea style={styles.scroll}>
          <ScrollView contentContainerStyle={styles.grid}>
            {tab === 'pack'
              ? STICKER_PACK.map((sticker) => (
                  <Pressable
                    key={sticker.code}
                    onPress={() => pick(packCode(sticker.code))}
                    accessibilityRole="button"
                    accessibilityLabel={`Enviar sticker ${sticker.label}`}
                  >
                    <StickerView value={packCode(sticker.code)} size={SIZE} />
                  </Pressable>
                ))
              : null}
            {tab === 'mine' ? (
              <>
                <Pressable
                  onPress={createSticker}
                  disabled={uploading}
                  accessibilityRole="button"
                  accessibilityLabel="Crear sticker desde una foto"
                  style={[styles.add, { borderColor: theme.colors.outline }]}
                >
                  {uploading ? <ActivityIndicator /> : <IconButton icon="plus" size={22} />}
                </Pressable>
                {mine.map((sticker) => (
                  <View key={sticker.id}>
                    <Pressable
                      onPress={() => pick(sticker.imageUrl)}
                      onLongPress={() => remove(sticker)}
                      accessibilityRole="button"
                      accessibilityLabel="Enviar sticker"
                      accessibilityHint="Mantén presionado para quitarlo de tu colección"
                    >
                      <StickerView value={sticker.imageUrl} size={SIZE} />
                    </Pressable>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
          {tab === 'mine' && loading ? <ActivityIndicator style={styles.loading} /> : null}
          {tab === 'mine' && !loading ? (
            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.muted }]}>
              Crea stickers con tus fotos o GIF animados (hasta 30). Mantén presionado uno para quitarlo.
            </Text>
          ) : null}
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 8,
  },
  scroll: {
    maxHeight: 380,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  add: {
    width: SIZE,
    height: SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    marginBottom: 8,
  },
  hint: {
    textAlign: 'center',
    paddingBottom: 8,
  },
});
