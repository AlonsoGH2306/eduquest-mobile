import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LibraryStackParamList } from '../types';
import { LibraryScreen } from '../screens/LibraryScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { UploadDocumentScreen } from '../screens/UploadDocumentScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { useStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="LibraryList" component={LibraryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Material' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} options={{ title: 'Mensaje' }} />
      <Stack.Screen
        name="UploadDocument"
        component={UploadDocumentScreen}
        options={({ route }) => ({
          title: route.params?.document ? 'Editar material' : 'Subir material',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}
