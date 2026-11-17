import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Group, GroupsStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { JoinPasswordDialog } from '../components/JoinPasswordDialog';
import { GroupAvatar } from '../components/GroupAvatar';
import { useGroupInvite } from '../hooks/useGroupInvite';
import { useGroupJoin } from '../hooks/useGroupJoin';
import { FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupInvite'>;

export function GroupInviteScreen({ route, navigation }: Props) {
  const theme = useAppTheme();
  const { group, loading, error, retry } = useGroupInvite(route.params.code);

  const openGroup = useCallback(
    (joined: Group) => navigation.replace('GroupDetail', { groupId: joined.id, group: joined }),
    [navigation]
  );
  const { start, joiningId, dialog } = useGroupJoin(openGroup);

  useEffect(() => {
    if (group?.member) openGroup(group);
  }, [group, openGroup]);

  const goToGroups = () => navigation.navigate('GroupsList');

  if (loading || group?.member) {
    return <StateView kind="loading" message="Abriendo la invitación…" />;
  }

  if (error || !group) {
    return (
      <StateView
        kind="error"
        icon="link-variant-off"
        title="No pudimos abrir la invitación"
        message={error ?? 'Inténtalo otra vez.'}
        actionLabel="Reintentar"
        onAction={retry}
      />
    );
  }

  const isPrivate = group.visibility === 'PRIVATE';

  return (
    <Screen>
      <Text variant="labelLarge" style={[styles.kicker, { color: theme.colors.primary }]}>
        Te invitaron a un grupo de estudio
      </Text>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <GroupAvatar group={group} size={72} radius={24} style={styles.avatar} />
        <Text style={[styles.name, { color: theme.colors.ink }]}>{group.name}</Text>
        {group.creatorUsername ? (
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            Creado por @{group.creatorUsername}
          </Text>
        ) : null}
        {group.description ? (
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {group.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <View
            style={[
              styles.badge,
              { backgroundColor: isPrivate ? theme.colors.primaryContainer : theme.colors.mintSoft },
            ]}
          >
            <MaterialCommunityIcons
              name={isPrivate ? 'lock-outline' : 'earth'}
              size={14}
              color={isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk}
            />
            <Text
              variant="labelMedium"
              style={{ color: isPrivate ? theme.colors.onPrimaryContainer : theme.colors.mintInk }}
            >
              {isPrivate ? 'Privado' : 'Público'}
            </Text>
          </View>
          <Text variant="labelMedium" style={{ color: theme.colors.muted }}>
            {group.memberCount === 1 ? '1 miembro' : `${group.memberCount} miembros`} · #{group.code}
          </Text>
        </View>
      </View>

      {isPrivate ? (
        <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.muted }]}>
          {route.params.token
            ? 'Es un grupo privado, pero con esta invitación no necesitas la contraseña.'
            : 'Es un grupo privado: te pediremos la contraseña que te compartió su creador.'}
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon={isPrivate ? 'lock-open-variant-outline' : 'account-plus-outline'}
        onPress={() => start(group, route.params.token)}
        loading={joiningId === group.id}
        disabled={joiningId === group.id}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Unirme al grupo
      </Button>
      <Button mode="text" onPress={goToGroups} style={styles.secondary}>
        Ahora no
      </Button>

      <JoinPasswordDialog {...dialog} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  secondary: {
    marginTop: spacing.xs,
  },
});
