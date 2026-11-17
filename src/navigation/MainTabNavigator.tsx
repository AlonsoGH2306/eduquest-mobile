import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { TabParamList } from '../types';
import { HomeStackNavigator } from './HomeStackNavigator';
import { LibraryStackNavigator } from './LibraryStackNavigator';
import { GroupsStackNavigator } from './GroupsStackNavigator';
import { StudyPlannerScreen } from '../screens/StudyPlannerScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { BRAND, FONTS, useAppTheme } from '../theme';
import { MyGroupsProvider } from '../contexts/MyGroupsContext';
import { SavedDocumentsProvider } from '../contexts/SavedDocumentsContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { useMyGroups, useNotifications } from '../hooks/useContexts';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  Library: ['library', 'library-outline'],
  Groups: ['people', 'people-outline'],
  Planner: ['sparkles', 'sparkles-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

export function MainTabNavigator() {
  return (
    <MyGroupsProvider>
      <NotificationsProvider>
        <SavedDocumentsProvider>
          <Tabs />
        </SavedDocumentsProvider>
      </NotificationsProvider>
    </MyGroupsProvider>
  );
}

function Tabs() {
  const theme = useAppTheme();
  const { totalUnread } = useMyGroups();
  const { unreadNotifications, unreadMessages } = useNotifications();
  const homeUnread = unreadNotifications + unreadMessages;
  const badgeStyle = { backgroundColor: BRAND.chicle, color: BRAND.noche, fontSize: 11, fontFamily: FONTS.bodyBold };
  const badgeFor = (count: number) => (count > 0 ? (count > 99 ? '99+' : count) : undefined);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.side,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: FONTS.bodySemiBold, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Inicio', tabBarBadge: badgeFor(homeUnread), tabBarBadgeStyle: badgeStyle }}
      />
      <Tab.Screen name="Library" component={LibraryStackNavigator} options={{ title: 'Biblioteca' }} />
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{
          title: 'Grupos',
          tabBarBadge: badgeFor(totalUnread),
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen name="Planner" component={StudyPlannerScreen} options={{ title: 'Plan' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
