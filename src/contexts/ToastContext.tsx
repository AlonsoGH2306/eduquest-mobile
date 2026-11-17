import { createContext, ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    }
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const background =
    toast.type === 'success'
      ? theme.colors.success
      : toast.type === 'error'
        ? theme.colors.error
        : theme.colors.inverseSurface;
  const foreground = toast.type === 'info' ? theme.colors.inverseOnSurface : theme.dark ? '#0E1330' : '#FFFFFF';

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
        duration={3200}
        style={[styles.snackbar, { backgroundColor: background }]}
        theme={{ colors: { inverseOnSurface: foreground } }}
        action={{ label: 'OK', textColor: foreground }}
      >
        {toast.message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 88,
    borderRadius: 14,
  },
});
