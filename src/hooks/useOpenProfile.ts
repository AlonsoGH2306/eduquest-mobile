import { useCallback } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';

export function useOpenProfile() {
  const navigation = useNavigation();
  return useCallback((userId: number) => navigation.dispatch(StackActions.push('UserProfile', { userId })), [navigation]);
}
