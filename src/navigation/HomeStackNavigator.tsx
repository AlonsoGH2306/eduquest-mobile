import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { FocusModeScreen } from '../screens/FocusModeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ForumScreen } from '../screens/ForumScreen';
import { ForumThreadScreen } from '../screens/ForumThreadScreen';
import { AskQuestionScreen } from '../screens/AskQuestionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { RoomChatScreen } from '../screens/RoomChatScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { SavedMessagesScreen } from '../screens/SavedMessagesScreen';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { useStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FocusMode" component={FocusModeScreen} options={{ title: 'Modo enfoque' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Mi calendario' }} />
      <Stack.Screen name="Forum" component={ForumScreen} options={{ title: 'Foro' }} />
      <Stack.Screen name="ForumThread" component={ForumThreadScreen} options={{ title: 'Pregunta' }} />
      <Stack.Screen
        name="AskQuestion"
        component={AskQuestionScreen}
        options={{ title: 'Hacer una pregunta', presentation: 'modal' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} options={{ title: 'Mensaje' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Material' }} />
      <Stack.Screen name="RoomChat" component={RoomChatScreen} options={{ title: 'Chat grupal' }} />
      <Stack.Screen
        name="CreateRoom"
        component={CreateRoomScreen}
        options={{ title: 'Nuevo chat grupal', presentation: 'modal' }}
      />
      <Stack.Screen name="SavedMessages" component={SavedMessagesScreen} options={{ title: 'Mensajes guardados' }} />
      <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} options={{ title: 'Buscar' }} />
    </Stack.Navigator>
  );
}
