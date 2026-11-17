import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupsStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { GroupAvatar, GroupBanner } from '../components/GroupAvatar';
import { ColorSwatches } from '../components/ColorSwatches';
import { useMyGroups, useToast } from '../hooks/useContexts';
import { useGroupImage } from '../hooks/useGroupImage';
import { updateGroupAppearance } from '../services/groupService';
import { groupColor } from '../utils/groupAppearance';
import { getErrorMessage } from '../utils/errors';
import { BRAND, FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupAppearance'>;

export function GroupAppearanceScreen({ navigation, route }: Props) {
  const { group } = route.params;
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { refresh: refreshMyGroups } = useMyGroups();
  const { pickImage, uploading } = useGroupImage();
  const [color, setColor] = useState(groupColor(group));
  const [iconUrl, setIconUrl] = useState<string | null>(group.iconUrl ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(group.bannerUrl ?? null);
  const [saving, setSaving] = useState(false);
  const preview = { name: group.name, color, iconUrl, bannerUrl };
  const busy = saving || uploading !== null;

  const chooseIcon = async () => {
    const url = await pickImage('icon');
    if (url) setIconUrl(url);
  };

  const chooseBanner = async () => {
    const url = await pickImage('banner');
    if (url) setBannerUrl(url);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateGroupAppearance(group.id, { color, iconUrl, bannerUrl });
      refreshMyGroups();
      showToast('Grupo personalizado', 'success');
      navigation.goBack();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
        <GroupBanner group={preview} height={110} />
        <View style={styles.previewBody}>
          <GroupAvatar group={preview} size={64} radius={22} style={[styles.previewAvatar, { borderColor: theme.colors.surface }]} />
          <Text style={[styles.previewName, { color: theme.colors.ink }]} numberOfLines={2}>
            {group.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            {group.memberCount === 1 ? '1 integrante' : `${group.memberCount} integrantes`}
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: theme.colors.ink }]}>Foto del grupo</Text>
      <View style={styles.iconRow}>
        <Pressable onPress={chooseIcon} disabled={busy} accessibilityRole="button" accessibilityLabel="Subir foto del grupo">
          <GroupAvatar group={preview} size={72} radius={24} />
          <View style={[styles.plus, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            {uploading === 'icon' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            )}
          </View>
        </Pressable>
        <View style={styles.iconActions}>
          <Button mode="contained" compact onPress={chooseIcon} disabled={busy}>
            Subir imagen
          </Button>
          {iconUrl ? (
            <Button mode="text" compact onPress={() => setIconUrl(null)} disabled={busy}>
              Quitar
            </Button>
          ) : null}
        </View>
      </View>
      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.muted }]}>
        PNG o JPG. Se recorta en forma de cuadrado.
      </Text>

      <Text style={[styles.label, { color: theme.colors.ink }]}>Portada</Text>
      <Pressable
        onPress={chooseBanner}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Subir portada del grupo"
        style={[styles.dropzone, { borderColor: theme.colors.outline }]}
      >
        {bannerUrl ? (
          <GroupBanner group={preview} height={96} style={styles.dropzoneImage} />
        ) : uploading === 'banner' ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.muted} />
            <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
              Toca para elegir una imagen panorámica
            </Text>
          </>
        )}
      </Pressable>
      {bannerUrl ? (
        <Button mode="text" compact onPress={() => setBannerUrl(null)} disabled={busy} style={styles.removeBanner}>
          Quitar portada
        </Button>
      ) : null}

      <Text style={[styles.label, { color: theme.colors.ink }]}>Color del grupo (si no hay foto)</Text>
      <ColorSwatches value={color} onChange={setColor} />

      <View style={styles.footer}>
        <Button mode="text" onPress={() => navigation.goBack()} disabled={saving}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          buttonColor={BRAND.mint}
          textColor={BRAND.noche}
          onPress={save}
          loading={saving}
          disabled={busy}
          contentStyle={styles.saveContent}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  previewBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  previewAvatar: {
    marginTop: -32,
    borderWidth: 4,
  },
  previewName: {
    fontFamily: FONTS.display,
    fontSize: 18,
    marginTop: spacing.sm,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  plus: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    marginTop: spacing.sm,
  },
  dropzone: {
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  dropzoneImage: {
    alignSelf: 'stretch',
  },
  removeBanner: {
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  saveContent: {
    paddingHorizontal: spacing.sm,
  },
});
