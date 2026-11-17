import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

const TOKEN_KEY = 'eduquest_push_token';
const CHANNEL_ID = 'default';

const projectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
};

export async function registerPushToken(): Promise<string | null> {
  const id = projectId();
  if (!id) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Actividad de EduQuest',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return null;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await api.post('/users/me/push-tokens', { token });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    await api.delete('/users/me/push-tokens', { data: { token } });
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    return;
  }
}

export function onPushOpened(handler: (link: string | null) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = response.notification.request.content.data?.link;
    handler(typeof link === 'string' ? link : null);
  });
  return () => subscription.remove();
}
