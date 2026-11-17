import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, IconButton, List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { UserAvatar } from '../components/UserAvatar';
import { PhotoOptionsDialog } from '../components/PhotoOptionsDialog';
import { EditUsernameDialog } from '../components/EditUsernameDialog';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';
import { StatusDialog } from '../components/StatusDialog';
import { updateStatus } from '../services/personalService';
import { availabilityColor, availabilityLabel } from '../utils/availability';
import type { Availability } from '../types';
import * as userService from '../services/userService';
import { useAvatarPicker } from '../hooks/useAvatarPicker';
import { useAuth, useThemeMode, useToast } from '../hooks/useContexts';
import type { ThemeMode } from '../contexts/ThemeContext';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { canSeeUsers, isAdmin, roleLabel } from '../utils/roles';
import { isIntroSoundEnabled, setIntroSoundEnabled } from '../utils/preferences';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { user, logout, refreshProfile, updateUsername, setAdvisor, updateProfile } = useAuth();
  const [editingStatus, setEditingStatus] = useState(false);
  const { mode, setMode } = useThemeMode();
  const { showToast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [introSound, setIntroSound] = useState(true);
  const [photoOptions, setPhotoOptions] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [savingAdvisor, setSavingAdvisor] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { uploading, takePhoto, chooseFromGallery, removePhoto } = useAvatarPicker();

  useEffect(() => {
    isIntroSoundEnabled().then(setIntroSound);
  }, []);

  const toggleIntroSound = (enabled: boolean) => {
    setIntroSound(enabled);
    setIntroSoundEnabled(enabled).catch(() => showToast('No se pudo guardar la preferencia.', 'error'));
  };

  useEffect(() => {
    refreshProfile().catch((error) => {
      if (!isCanceled(error)) showToast(getErrorMessage(error), 'error');
    });
  }, [refreshProfile, showToast]);

  if (!user) return null;

  const toggleAdvisor = async (advisor: boolean) => {
    setSavingAdvisor(true);
    try {
      await setAdvisor(advisor);
      showToast(advisor ? '¡Ahora apareces como asesor!' : 'Ya no apareces como asesor', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingAdvisor(false);
    }
  };

  const saveStatus = async (payload: { availability: Availability; statusText?: string; statusEmoji?: string }) => {
    if (!user) return;
    try {
      const status = await updateStatus(payload);
      await updateProfile({
        ...user,
        availability: status.availability,
        statusText: status.statusText,
        statusEmoji: status.statusEmoji,
      });
      showToast('Estado actualizado', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      throw err;
    }
  };

  const saveUsername = async (username: string) => {
    await updateUsername(username);
    showToast(`Ahora eres @${username}`, 'success');
  };

  return (
    <Screen safeTop>
      <ScreenTitle title="Tu perfil" />

      <View style={styles.identity}>
        <Pressable
          onPress={() => setPhotoOptions(true)}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          style={styles.avatarWrap}
        >
          <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={88} />
          {uploading ? (
            <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(14,19,48,0.55)' }]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="camera" size={15} color={theme.colors.onPrimary} />
          </View>
        </Pressable>
        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text variant="titleLarge" numberOfLines={1} style={[styles.name, { color: theme.colors.ink }]}>
              @{user.username}
            </Text>
            <IconButton
              icon="pencil-outline"
              size={18}
              onPress={() => setEditingName(true)}
              accessibilityLabel="Cambiar nombre de usuario"
              style={styles.editName}
            />
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
            {user.email}
          </Text>
          <View style={styles.roles}>
            {user.roles.map((role) => (
              <View key={role} style={[styles.role, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                  {roleLabel(role)}
                </Text>
              </View>
            ))}
            {user.advisor ? (
              <View style={[styles.role, styles.advisorRole, { backgroundColor: theme.colors.highlight }]}>
                <MaterialCommunityIcons name="school-outline" size={12} color={theme.colors.onHighlight} />
                <Text variant="labelMedium" style={{ color: theme.colors.onHighlight }}>
                  Asesor
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      {user ? (
        <List.Item
          title="Mi perfil público"
          description="Así te ven los demás; desde ahí también ves a quién sigues"
          left={(props) => <List.Icon {...props} icon="account-eye-outline" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
          style={[styles.adminItem, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      ) : null}

      <List.Item
        title={[user.statusEmoji, user.statusText].filter(Boolean).join(' ') || 'Definir un estado'}
        description={`${availabilityLabel(user.availability)} · toca para cambiarlo`}
        left={(props) => (
          <View {...props} style={[props.style, styles.statusDot, { backgroundColor: availabilityColor(user.availability) }]} />
        )}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => setEditingStatus(true)}
        style={[styles.adminItem, { backgroundColor: theme.colors.surfaceVariant }]}
      />

      <List.Item
        title="Logros y ranking"
        description="Tus puntos, insignias y el top de la comunidad"
        left={(props) => <List.Icon {...props} icon="trophy-outline" color={theme.colors.warning} />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => navigation.navigate('Achievements')}
        style={[styles.adminItem, { backgroundColor: theme.colors.surfaceVariant }]}
      />

      {canSeeUsers(user.roles) ? (
        <>
          <List.Item
            title="Administrar usuarios"
            description="Ver cuentas registradas y asignar roles"
            left={(props) => <List.Icon {...props} icon="shield-account-outline" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('AdminUsers')}
            style={[styles.adminItem, { backgroundColor: theme.colors.primaryContainer }]}
          />
          <List.Item
            title="Reportes de la comunidad"
            description="Revisar materiales y usuarios reportados"
            left={(props) => <List.Icon {...props} icon="flag-outline" color={theme.colors.error} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('AdminReports')}
            style={[styles.adminItem, { backgroundColor: theme.colors.primaryContainer }]}
          />
          <List.Item
            title="Apelaciones"
            description="Revisar pedidos de usuarios suspendidos"
            left={(props) => <List.Icon {...props} icon="scale-balance" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('AdminAppeals')}
            style={[styles.adminItem, { backgroundColor: theme.colors.primaryContainer }]}
          />
          {isAdmin(user.roles) ? (
            <List.Item
              title="Enviar aviso"
              description="Notificar a toda la comunidad o a una persona"
              left={(props) => <List.Icon {...props} icon="bullhorn-outline" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('AdminAnnouncement')}
              style={[styles.adminItem, { backgroundColor: theme.colors.primaryContainer }]}
            />
          ) : null}
        </>
      ) : null}

      <List.Item
        title="Cambiar contraseña"
        description="Reemplázala por una nueva o recupérala con tu correo"
        left={(props) => <List.Icon {...props} icon="lock-reset" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => setChangingPassword(true)}
      />

      <List.Item
        title="Perfil de asesor"
        description="Dicta asesorías y muestra una insignia junto a tu nombre"
        left={(props) => <List.Icon {...props} icon="school-outline" />}
        right={() => <Switch value={Boolean(user.advisor)} onValueChange={toggleAdvisor} disabled={savingAdvisor} />}
        onPress={() => toggleAdvisor(!user.advisor)}
        disabled={savingAdvisor}
      />

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.ink }]}>
        Apariencia
      </Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as ThemeMode)}
        buttons={[
          { value: 'system', label: 'Sistema', icon: 'cellphone' },
          { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
          { value: 'dark', label: 'Oscuro', icon: 'weather-night' },
        ]}
      />

      <List.Item
        title="Sonido al abrir la app"
        description="Un tono corto cuando aparece el logo"
        left={(props) => <List.Icon {...props} icon={introSound ? 'volume-high' : 'volume-off'} />}
        right={() => <Switch value={introSound} onValueChange={toggleIntroSound} />}
        onPress={() => toggleIntroSound(!introSound)}
      />

      <Button
        mode="outlined"
        icon="logout"
        onPress={() => setConfirmLogout(true)}
        textColor={theme.colors.error}
        style={[styles.logout, { borderColor: theme.colors.error }]}
      >
        Cerrar sesión
      </Button>

      <PhotoOptionsDialog
        visible={photoOptions}
        hasPhoto={Boolean(user.avatarUrl)}
        onTakePhoto={takePhoto}
        onChooseFromGallery={chooseFromGallery}
        onRemovePhoto={removePhoto}
        onDismiss={() => setPhotoOptions(false)}
      />

      <ChangePasswordDialog
        visible={changingPassword}
        onDismiss={() => setChangingPassword(false)}
        onForgot={() => {
          setChangingPassword(false);
          navigation.navigate('ForgotPassword', { email: user.email });
        }}
        onSave={async (currentPassword, newPassword) => {
          await userService.changePassword(currentPassword, newPassword);
          showToast('Contraseña actualizada', 'success');
          setChangingPassword(false);
        }}
      />

      <StatusDialog
        visible={editingStatus}
        availability={user.availability ?? 'AVAILABLE'}
        statusText={user.statusText ?? ''}
        statusEmoji={user.statusEmoji ?? ''}
        onSave={saveStatus}
        onDismiss={() => setEditingStatus(false)}
      />

      <EditUsernameDialog
        visible={editingName}
        currentUsername={user.username}
        onSave={saveUsername}
        onDismiss={() => setEditingName(false)}
      />

      <ConfirmDialog
        visible={confirmLogout}
        title="¿Cerrar sesión?"
        message="Tendrás que ingresar tu usuario y contraseña la próxima vez."
        confirmLabel="Cerrar sesión"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: 'center',
    marginLeft: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 88,
    height: 88,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flexShrink: 1,
  },
  editName: {
    margin: 0,
  },
  identityText: {
    flex: 1,
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  role: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  advisorRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  adminItem: {
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  logout: {
    marginTop: spacing.xl,
    borderRadius: 14,
  },
});
