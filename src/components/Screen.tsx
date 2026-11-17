import { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useAppTheme } from '../theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
}

export const screenPadding = {
  paddingHorizontal: spacing.md + 4,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl * 3,
};

export function Screen({ children, scroll = true, safeTop = false, contentStyle, refreshControl }: ScreenProps) {
  const theme = useAppTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={safeTop ? ['top', 'left', 'right'] : ['left', 'right']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: screenPadding,
});
