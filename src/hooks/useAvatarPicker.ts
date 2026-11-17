import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { deleteAvatar, ImageFile, uploadAvatar } from '../services/userService';
import { useAuth, useToast } from './useContexts';
import { getErrorMessage } from '../utils/errors';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

async function prepareImage(asset: ImagePicker.ImagePickerAsset): Promise<ImageFile> {
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize({ width: 512 });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return { uri: saved.uri, name: 'avatar.jpg', type: 'image/jpeg' };
  } catch {
    return {
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    };
  }
}

export function useAvatarPicker() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      setUploading(true);
      try {
        const profile = await uploadAvatar(await prepareImage(asset));
        await updateProfile(profile);
        showToast('Foto de perfil actualizada', 'success');
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      } finally {
        setUploading(false);
      }
    },
    [updateProfile, showToast]
  );

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast(
        permission.canAskAgain
          ? 'Necesitamos la cámara para tomarte la foto.'
          : 'Activa el permiso de cámara en los ajustes del teléfono.',
        'error'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      ...PICKER_OPTIONS,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets[0]) await upload(result.assets[0]);
  }, [showToast, upload]);

  const chooseFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(
        permission.canAskAgain
          ? 'Necesitamos acceso a tus fotos para elegir una.'
          : 'Activa el permiso de fotos en los ajustes del teléfono.',
        'error'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) await upload(result.assets[0]);
  }, [showToast, upload]);

  const removePhoto = useCallback(async () => {
    if (!user) return;
    setUploading(true);
    try {
      await deleteAvatar();
      await updateProfile({ ...user, avatarUrl: null });
      showToast('Foto de perfil eliminada', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setUploading(false);
    }
  }, [user, updateProfile, showToast]);

  return { uploading, takePhoto, chooseFromGallery, removePhoto };
}
