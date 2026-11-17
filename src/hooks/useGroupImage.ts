import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { PickedFile, uploadFile } from '../services/documentService';
import { useToast } from './useContexts';
import { getErrorMessage } from '../utils/errors';

export type GroupImageKind = 'icon' | 'banner';

const SETTINGS: Record<GroupImageKind, { aspect: [number, number]; width: number; name: string }> = {
  icon: { aspect: [1, 1], width: 512, name: 'grupo-foto.jpg' },
  banner: { aspect: [3, 1], width: 1200, name: 'grupo-portada.jpg' },
};

async function prepareImage(asset: ImagePicker.ImagePickerAsset, kind: GroupImageKind): Promise<PickedFile> {
  const { width, name } = SETTINGS[kind];
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize({ width });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
    return { uri: saved.uri, name, mimeType: 'image/jpeg' };
  } catch {
    return { uri: asset.uri, name: asset.fileName ?? name, mimeType: asset.mimeType ?? 'image/jpeg' };
  }
}

export function useGroupImage() {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState<GroupImageKind | null>(null);

  const pickImage = useCallback(
    async (kind: GroupImageKind): Promise<string | null> => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(
          permission.canAskAgain
            ? 'Necesitamos acceso a tus fotos para elegir una imagen.'
            : 'Activa el permiso de fotos en los ajustes del teléfono.',
          'error'
        );
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: SETTINGS[kind].aspect,
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return null;

      setUploading(kind);
      try {
        const uploaded = await uploadFile(await prepareImage(result.assets[0], kind));
        return uploaded.url;
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
        return null;
      } finally {
        setUploading(null);
      }
    },
    [showToast]
  );

  return { pickImage, uploading };
}
