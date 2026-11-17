import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
} from '@react-navigation/native';
import { AnimatedSplash } from '../components/AnimatedSplash';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuth } from '../hooks/useContexts';
import { useAppTheme } from '../theme';
import { AuthStackNavigator } from './AuthStackNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { BannedScreen } from '../screens/BannedScreen';
import { LINK_PREFIXES } from '../utils/deepLinks';
import type { TabParamList } from '../types';
import { onPushOpened } from '../utils/pushNotifications';
import { openNotificationLink } from '../utils/notificationLinks';

const navigationRef = createNavigationContainerRef<TabParamList>();
let initialUrlConsumed = false;
let pendingUrl: string | null = null;

const linking: LinkingOptions<TabParamList> = {
  prefixes: LINK_PREFIXES,
  async getInitialURL() {
    if (pendingUrl) {
      const url = pendingUrl;
      pendingUrl = null;
      initialUrlConsumed = true;
      return url;
    }
    if (initialUrlConsumed) return null;
    initialUrlConsumed = true;
    return Linking.getInitialURL();
  },
  config: {
    screens: {
      Groups: {
        initialRouteName: 'GroupsList',
        screens: {
          GroupInvite: 'groups/:code',
        },
      },
    },
  },
};

export function RootNavigator() {
  const theme = useAppTheme();
  const { user, isRestoring, banInfo } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  useEffect(() => {
    if (user) return;
    const subscription = Linking.addEventListener('url', ({ url }) => {
      pendingUrl = url;
    });
    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onPushOpened((link) => {
      if (navigationRef.isReady()) openNotificationLink(navigationRef, link);
    });
  }, [user]);

  const navigationTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.side,
        text: theme.colors.ink,
        border: theme.colors.outlineVariant,
        notification: theme.colors.error,
      },
    };
  }, [theme]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {!isRestoring ? (
        banInfo ? (
          <BannedScreen />
        ) : (
          <NavigationContainer
            ref={user ? navigationRef : undefined}
            key={user ? 'app' : 'auth'}
            theme={navigationTheme}
            linking={user ? linking : undefined}
          >
            <OfflineBanner />
            {user ? <MainTabNavigator /> : <AuthStackNavigator />}
          </NavigationContainer>
        )
      ) : null}
      {splashVisible ? <AnimatedSplash ready={!isRestoring} onFinish={hideSplash} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
