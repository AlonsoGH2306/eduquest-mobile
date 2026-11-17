import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminReportsScreen } from '../screens/AdminReportsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { AdminAnnouncementScreen } from '../screens/AdminAnnouncementScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { AdminAppealsScreen } from '../screens/AdminAppealsScreen';
import { useStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Usuarios' }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Reportes' }} />
      <Stack.Screen name="AdminAppeals" component={AdminAppealsScreen} options={{ title: 'Apelaciones' }} />
      <Stack.Screen name="AdminAnnouncement" component={AdminAnnouncementScreen} options={{ title: 'Avisos' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Logros y ranking' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar contraseña' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} options={{ title: 'Mensaje' }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Material' }} />
    </Stack.Navigator>
  );
}
