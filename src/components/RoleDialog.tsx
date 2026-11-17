import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserProfile } from '../types';
import { primaryRole, ROLE_OPTIONS, RoleName } from '../utils/roles';
import { spacing, useAppTheme } from '../theme';

interface RoleDialogProps {
  user: UserProfile | null;
  saving: boolean;
  onSave: (user: UserProfile, role: RoleName) => void;
  onDismiss: () => void;
}

export function RoleDialog({ user, saving, onSave, onDismiss }: RoleDialogProps) {
  const theme = useAppTheme();
  const [selected, setSelected] = useState<RoleName>('ROLE_USER');

  useEffect(() => {
    if (user) setSelected(primaryRole(user.roles));
  }, [user]);

  const currentRole = user ? primaryRole(user.roles) : null;

  return (
    <Portal>
      <Dialog visible={Boolean(user)} onDismiss={saving ? undefined : onDismiss}>
        <Dialog.Title>Rol de @{user?.username}</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group value={selected} onValueChange={(value) => setSelected(value as RoleName)}>
            {ROLE_OPTIONS.map((option) => {
              const active = selected === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelected(option.value)}
                  disabled={saving}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={[
                    styles.option,
                    {
                      borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                      backgroundColor: active ? theme.colors.primaryContainer : 'transparent',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={active ? theme.colors.primary : theme.colors.muted}
                  />
                  <View style={styles.optionText}>
                    <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
                      {option.label}
                      {option.value === currentRole ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                          {'  '}actual
                        </Text>
                      ) : null}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                      {option.description}
                    </Text>
                  </View>
                  <RadioButton value={option.value} disabled={saving} />
                </Pressable>
              );
            })}
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={() => user && onSave(user, selected)}
            loading={saving}
            disabled={saving || selected === currentRole}
          >
            Guardar rol
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  optionText: {
    flex: 1,
  },
});
