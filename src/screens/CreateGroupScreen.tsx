import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupsStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { GroupAvatar } from '../components/GroupAvatar';
import { ColorSwatches } from '../components/ColorSwatches';
import { useGroupImage } from '../hooks/useGroupImage';
import { updateGroupAppearance } from '../services/groupService';
import { GROUP_COLORS } from '../utils/groupAppearance';
import { useForm } from '../hooks/useForm';
import { useToast } from '../hooks/useContexts';
import { useCreateGroup } from '../hooks/useCreateGroup';
import { validateGroup } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateGroup'>;

const INITIAL_VALUES = { name: '', description: '', visibility: 'PUBLIC', password: '', confirmPassword: '' };

export function CreateGroupScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm(INITIAL_VALUES, validateGroup);
  const { createGroup } = useCreateGroup();
  const [hidePassword, setHidePassword] = useState(true);
  const isPrivate = form.values.visibility === 'PRIVATE';
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const { pickImage, uploading } = useGroupImage();
  const preview = { name: form.values.name.trim() || 'Nuevo grupo', color, iconUrl };

  const chooseIcon = async () => {
    const url = await pickImage('icon');
    if (url) setIconUrl(url);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const group = await createGroup({
        name: values.name.trim(),
        description: values.description.trim(),
        visibility: values.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
        password: values.visibility === 'PRIVATE' ? values.password : undefined,
        color,
      });
      let created = group;
      if (iconUrl) {
        try {
          created = await updateGroupAppearance(group.id, { color, iconUrl, bannerUrl: null });
        } catch {
          showToast('El grupo se creó, pero no pudimos guardar la foto. Puedes subirla desde Personalizar grupo.', 'error');
        }
      }
      showToast(`Grupo "${created.name}" creado`, 'success');
      navigation.replace('GroupDetail', { groupId: created.id, group: created });
    } catch (error) {
      form.applyServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.muted }]}>
        Entrarás como primer miembro. Luego podrás invitar a tus compañeros con el QR o el código del grupo.
      </Text>
      <View style={[styles.appearance, { backgroundColor: theme.colors.surface }]}>
        <Pressable
          onPress={chooseIcon}
          disabled={uploading !== null || form.submitting}
          accessibilityRole="button"
          accessibilityLabel={iconUrl ? 'Cambiar la foto del grupo' : 'Subir una foto del grupo'}
        >
          <GroupAvatar group={preview} size={68} radius={24} />
          <View style={[styles.plus, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
            {uploading === 'icon' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name={iconUrl ? 'pencil' : 'plus'} size={14} color="#FFFFFF" />
            )}
          </View>
        </Pressable>
        <View style={styles.appearanceText}>
          <Text style={[styles.appearanceTitle, { color: theme.colors.ink }]}>Color del grupo</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted, marginBottom: spacing.sm }}>
            {iconUrl ? 'El color se usa en la portada.' : 'Toca el ícono para subir una foto, o elige un color.'}
          </Text>
          <ColorSwatches value={color} onChange={setColor} />
        </View>
      </View>
      <FormField
        label="Nombre del grupo"
        value={form.values.name}
        onChangeText={(text) => form.setField('name', text)}
        error={form.errors.name}
        placeholder="Ej. DBP 2026-2, equipo del proyecto"
        maxLength={100}
      />
      <FormField
        label="Descripción (opcional)"
        value={form.values.description}
        onChangeText={(text) => form.setField('description', text)}
        multiline
        numberOfLines={4}
        placeholder="Para qué es el grupo y cuándo se reúnen"
      />
      <Text variant="titleSmall" style={[styles.label, { color: theme.colors.ink }]}>
        ¿Quién puede entrar?
      </Text>
      <SegmentedButtons
        value={form.values.visibility}
        onValueChange={(value) => form.setField('visibility', value)}
        buttons={[
          { value: 'PUBLIC', label: 'Público', icon: 'earth' },
          { value: 'PRIVATE', label: 'Privado', icon: 'lock-outline' },
        ]}
      />
      <Text variant="bodySmall" style={[styles.visibilityHint, { color: theme.colors.muted }]}>
        {isPrivate
          ? 'No aparecerá en la lista. Solo entra quien tenga el código y la contraseña.'
          : 'Aparecerá en la lista y cualquiera podrá unirse con un toque.'}
      </Text>
      {isPrivate ? (
        <FormField
          label="Contraseña de ingreso"
          value={form.values.password}
          onChangeText={(text) => form.setField('password', text)}
          error={form.errors.password}
          hint="Compártela solo con las personas que quieras en el grupo."
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={50}
          right={
            <TextInput.Icon
              icon={hidePassword ? 'eye-outline' : 'eye-off-outline'}
              onPress={() => setHidePassword((value) => !value)}
              accessibilityLabel={hidePassword ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            />
          }
        />
      ) : null}
      {isPrivate ? (
        <FormField
          label="Confirmar contraseña"
          value={form.values.confirmPassword}
          onChangeText={(text) => form.setField('confirmPassword', text)}
          error={form.errors.confirmPassword}
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={50}
        />
      ) : null}
      {formError ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {formError}
        </Text>
      ) : null}
      <Button
        mode="contained"
        icon="account-group"
        onPress={onSubmit}
        loading={form.submitting}
        disabled={form.submitting}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {form.submitting ? 'Creando grupo…' : 'Crear grupo'}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.md,
  },
  appearance: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 24,
    marginBottom: spacing.lg,
  },
  appearanceText: {
    flex: 1,
  },
  appearanceTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  plus: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  visibilityHint: {
    marginTop: 6,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
