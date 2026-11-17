import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { ToastContext } from '../contexts/ToastContext';
import { MyGroupsContext } from '../contexts/MyGroupsContext';
import { SavedDocumentsContext } from '../contexts/SavedDocumentsContext';
import { NotificationsContext } from '../contexts/NotificationsContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode debe usarse dentro de ThemeProvider');
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}

export function useMyGroups() {
  const context = useContext(MyGroupsContext);
  if (!context) throw new Error('useMyGroups debe usarse dentro de MyGroupsProvider');
  return context;
}

export function useSavedDocuments() {
  const context = useContext(SavedDocumentsContext);
  if (!context) throw new Error('useSavedDocuments debe usarse dentro de SavedDocumentsProvider');
  return context;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return context;
}
