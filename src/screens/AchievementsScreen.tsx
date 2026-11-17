import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { LeaderboardPeriod } from '../types';
import { Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { LeaderboardList } from '../components/LeaderboardList';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../hooks/useContexts';
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

const POINT_RULES = [
  { label: 'Tu respuesta del foro es elegida como la solución', points: 8 },
  { label: 'Dictar una asesoría a la que asiste alguien', points: 10 },
  { label: 'Asistir con «Unirme ahora»', points: 5 },
  { label: 'Compartir un material', points: 5 },
  { label: 'Tu material recibe una reseña de 4 o 5 estrellas', points: 3 },
  { label: 'Reseñar un material', points: 2 },
  { label: 'Calificar una asesoría', points: 2 },
  { label: 'Cada ▲ que recibe tu respuesta (hasta 5)', points: 1 },
  { label: 'Confirmar y no asistir', points: -3 },
];

export function AchievementsScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const { profile, leaderboard, loading, leaderboardLoading, refreshing, error, refresh, retry } = useAchievements(period);

  if (loading) {
    return (
      <Screen>
        <ListSkeleton count={4} label="Cargando tus logros" />
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen>
        <StateView kind="error" title="No pudimos cargar tus logros" message={error ?? ''} actionLabel="Reintentar" onAction={retry} />
      </Screen>
    );
  }

  const earned = profile.badges.filter((badge) => badge.earned).length;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <MaterialCommunityIcons name="trophy-outline" size={26} color={theme.colors.onPrimary} />
        <Text style={[styles.points, { color: theme.colors.onPrimary }]}>{profile.points}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
          puntos totales
        </Text>
        <View style={styles.heroStats}>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
            +{profile.weeklyPoints} esta semana
          </Text>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
            {profile.rank ? `Puesto #${profile.rank}` : 'Sin puesto aún'}
          </Text>
        </View>
      </View>

      <Text variant="titleLarge" style={[styles.section, { color: theme.colors.ink }]}>
        Insignias ({earned}/{profile.badges.length})
      </Text>
      <View style={styles.badges}>
        {profile.badges.map((badge) => (
          <View
            key={badge.code}
            style={[
              styles.badge,
              {
                backgroundColor: badge.earned ? theme.colors.surface : theme.colors.surfaceVariant,
                borderColor: badge.earned ? theme.colors.warning : theme.colors.outlineVariant,
                opacity: badge.earned ? 1 : 0.65,
              },
            ]}
            accessibilityLabel={`${badge.name}: ${badge.earned ? 'desbloqueada' : 'bloqueada'}. ${badge.description}`}
          >
            <MaterialCommunityIcons
              name={badge.earned ? BADGE_ICONS[badge.code] ?? 'medal-outline' : 'lock-outline'}
              size={26}
              color={badge.earned ? theme.colors.warning : theme.colors.muted}
            />
            <Text variant="titleSmall" style={[styles.badgeName, { color: theme.colors.ink }]}>
              {badge.name}
            </Text>
            <Text variant="bodySmall" style={[styles.badgeText, { color: theme.colors.muted }]}>
              {badge.description}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="titleLarge" style={[styles.section, { color: theme.colors.ink }]}>
        Ranking
      </Text>
      <SegmentedButtons
        value={period}
        onValueChange={(value) => setPeriod(value as LeaderboardPeriod)}
        buttons={[
          { value: 'week', label: 'Esta semana' },
          { value: 'all', label: 'Histórico' },
        ]}
        style={styles.segment}
      />
      {leaderboardLoading ? (
        <ListSkeleton count={3} avatar="circle" label="Cargando ranking" />
      ) : leaderboard.length === 0 ? (
        <StateView kind="empty" compact icon="podium" title="Nadie suma puntos todavía" message="¡Sé el primero!" />
      ) : (
        <LeaderboardList entries={leaderboard} currentUserId={user?.id} />
      )}

      <Text variant="titleLarge" style={[styles.section, { color: theme.colors.ink }]}>
        ¿Cómo se ganan puntos?
      </Text>
      {POINT_RULES.map((rule) => (
        <View key={rule.label} style={[styles.rule, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {rule.label}
          </Text>
          <Text variant="titleSmall" style={{ color: rule.points < 0 ? theme.colors.error : theme.colors.primary }}>
            {rule.points > 0 ? `+${rule.points}` : rule.points}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
  },
  points: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 44,
    lineHeight: 52,
    marginTop: spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
  badgeName: {
    marginTop: 6,
    textAlign: 'center',
  },
  badgeText: {
    textAlign: 'center',
    marginTop: 2,
  },
  segment: {
    marginBottom: spacing.sm,
  },
  rule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
