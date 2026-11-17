import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import type { DocumentItem, ProfileRoutes, PublicProfile, UserSummary } from '../types';
import { followUser, getFollowing, getPublicDocuments, getPublicProfile, unfollowUser } from '../services/userService';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { UserAvatar } from '../components/UserAvatar';
import { DocumentRow } from '../components/DocumentRow';
import { useToast } from '../hooks/useContexts';
import { useOpenProfile } from '../hooks/useOpenProfile';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { FONTS, spacing, useAppTheme } from '../theme';

const BADGE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  FIRST_UPLOAD: 'bookmark-plus-outline',
  LIBRARIAN: 'bookshelf',
  CRITIC: 'comment-quote-outline',
  ORGANIZER: 'calendar-check-outline',
  LOYAL: 'medal-outline',
  PLANNER: 'format-list-checks',
  TOP_ADVISOR: 'crown-outline',
};

const memberSince = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }) : null;

export function UserProfileScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<NavigationProp<ProfileRoutes>>();
  const { userId } = useRoute<RouteProp<ProfileRoutes, 'UserProfile'>>().params;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [following, setFollowing] = useState<UserSummary[]>([]);
  const openProfile = useOpenProfile();

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        const [nextProfile, nextDocuments] = await Promise.all([
          getPublicProfile(userId, signal),
          getPublicDocuments(userId, 0, 10, signal),
        ]);
        setProfile(nextProfile);
        setDocuments(nextDocuments.content);
        setFollowing(nextProfile.me ? await getFollowing(signal) : []);
      } catch (err) {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      }
    },
    [userId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useLayoutEffect(() => {
    if (profile) navigation.setOptions({ title: `@${profile.username}` });
  }, [navigation, profile]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleFollow = async () => {
    if (!profile) return;
    const following = profile.followedByMe;
    setToggling(true);
    try {
      if (following) await unfollowUser(userId);
      else await followUser(userId);
      setProfile({ ...profile, followedByMe: !following, followers: profile.followers + (following ? -1 : 1) });
      showToast(following ? `Dejaste de seguir a @${profile.username}` : `Ahora sigues a @${profile.username}`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setToggling(false);
    }
  };

  if (error) {
    return (
      <Screen>
        <StateView kind="error" title="No pudimos cargar el perfil" message={error} actionLabel="Reintentar" onAction={() => load()} />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <StateView kind="loading" message="Cargando perfil" />
      </Screen>
    );
  }

  const since = memberSince(profile.memberSince);
  const stats = [
    { label: 'Puntos', value: String(profile.points) },
    { label: 'Ranking', value: profile.rank ? `#${profile.rank}` : '—' },
    { label: 'Materiales', value: String(profile.stats.documents) },
    { label: 'Asesorías', value: String(profile.stats.sessionsHosted) },
  ];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={styles.header}>
        <UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} size={84} />
        <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.ink }]}>
          @{profile.username}
        </Text>
        {profile.advisor ? (
          <Text variant="labelLarge" style={{ color: theme.colors.warning }}>
            Asesor
          </Text>
        ) : null}
        <Text variant="bodyMedium" style={{ color: theme.colors.muted, marginTop: spacing.xs }}>
          {profile.followers} {profile.followers === 1 ? 'seguidor' : 'seguidores'} · {profile.following} siguiendo
        </Text>
        {since ? (
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            Miembro desde {since}
          </Text>
        ) : null}
      </View>

      {!profile.me ? (
        <View style={styles.actions}>
          <Button
            mode={profile.followedByMe ? 'outlined' : 'contained'}
            icon={profile.followedByMe ? 'account-check-outline' : 'account-plus-outline'}
            onPress={toggleFollow}
            loading={toggling}
            disabled={toggling}
            style={styles.action}
          >
            {profile.followedByMe ? 'Siguiendo' : 'Seguir'}
          </Button>
          <Button
            mode="outlined"
            icon="message-outline"
            onPress={() => navigation.navigate('DirectChat', { userId: profile.id, username: profile.username })}
            style={styles.action}
          >
            Mensaje
          </Button>
        </View>
      ) : null}

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.stat, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.muted }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {profile.me ? (
        <>
          <Text variant="titleMedium" style={[styles.section, { color: theme.colors.ink }]}>
            Personas que sigo
          </Text>
          {following.length > 0 ? (
            <View style={styles.chips}>
              {following.map((person) => (
                <Chip key={person.id} icon="account-outline" onPress={() => openProfile(person.id)}>
                  @{person.username}
                </Chip>
              ))}
            </View>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
              Aún no sigues a nadie. Toca a un compañero en un grupo, el ranking o un material.
            </Text>
          )}
        </>
      ) : null}

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.ink }]}>
        Insignias
      </Text>
      {profile.badges.length > 0 ? (
        <View style={styles.badges}>
          {profile.badges.map((badge) => (
            <View key={badge.code} style={[styles.badge, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name={BADGE_ICONS[badge.code] ?? 'medal-outline'} size={26} color={theme.colors.warning} />
              <Text variant="labelLarge" style={{ color: theme.colors.ink, textAlign: 'center', marginTop: 4 }}>
                {badge.name}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          Todavía no gana insignias.
        </Text>
      )}

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.ink }]}>
        Materiales públicos
      </Text>
      {documents.length > 0 ? (
        documents.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            onPress={(selected) => navigation.navigate('DocumentDetail', { document: selected })}
          />
        ))
      ) : (
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          No ha compartido material en la biblioteca pública.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  name: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
  },
  statValue: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 22,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  badge: {
    width: '48.5%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
  },
});
