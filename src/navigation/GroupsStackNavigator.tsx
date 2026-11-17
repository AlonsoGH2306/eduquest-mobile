import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GroupsStackParamList } from '../types';
import { GroupsScreen } from '../screens/GroupsScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupAppearanceScreen } from '../screens/GroupAppearanceScreen';
import { ScanGroupScreen } from '../screens/ScanGroupScreen';
import { GroupInviteScreen } from '../screens/GroupInviteScreen';
import { ScheduleSessionScreen } from '../screens/ScheduleSessionScreen';
import { UploadDocumentScreen } from '../screens/UploadDocumentScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { GroupChatScreen } from '../screens/GroupChatScreen';
import { GroupThreadScreen } from '../screens/GroupThreadScreen';
import { GroupChatSearchScreen } from '../screens/GroupChatSearchScreen';
import { SessionReviewsScreen } from '../screens/SessionReviewsScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { useStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="GroupsList" component={GroupsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Grupo' }} />
      <Stack.Screen
        name="GroupAppearance"
        component={GroupAppearanceScreen}
        options={{ title: 'Personaliza tu grupo', presentation: 'modal' }}
      />
      <Stack.Screen name="GroupInvite" component={GroupInviteScreen} options={{ title: 'Invitación' }} />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Nuevo grupo', presentation: 'modal' }}
      />
      <Stack.Screen
        name="ScanGroup"
        component={ScanGroupScreen}
        options={{ title: 'Escanear QR', headerStyle: { backgroundColor: '#000000' }, headerTintColor: '#FFFFFF' }}
      />
      <Stack.Screen
        name="ScheduleSession"
        component={ScheduleSessionScreen}
        options={({ route }) => ({
          title: route.params.session ? 'Editar sesión' : 'Agendar sesión',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="GroupUpload"
        component={UploadDocumentScreen}
        options={({ route }) => ({
          title: route.params.document ? 'Editar material' : `Subir a ${route.params.groupName ?? 'el grupo'}`,
          presentation: 'modal',
        })}
      />
      <Stack.Screen name="GroupDocumentDetail" component={DocumentDetailScreen} options={{ title: 'Material' }} />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={({ route }) => ({ title: route.params.groupName ?? 'Chat del grupo' })}
      />
      <Stack.Screen name="GroupThread" component={GroupThreadScreen} options={{ title: 'Hilo' }} />
      <Stack.Screen name="GroupChatSearch" component={GroupChatSearchScreen} options={{ title: 'Buscar en el chat' }} />
      <Stack.Screen name="SessionReviews" component={SessionReviewsScreen} options={{ title: 'Reseñas' }} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} options={{ title: 'Mensaje' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Material' }} />
    </Stack.Navigator>
  );
}
