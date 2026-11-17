import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DocumentItem, Group, HomeStackParamList, TabParamList } from '../types';
import { Screen } from '../components/Screen';
import { NightSky } from '../components/NightSky';
import { Lumi } from '../components/Lumi';
import { GroupAvatar, GroupBanner } from '../components/GroupAvatar';
import { WeatherStrip } from '../components/WeatherStrip';
import { VerifyEmailCard } from '../components/VerifyEmailCard';
import { UserAvatar } from '../components/UserAvatar';
import { DocumentRow } from '../components/DocumentRow';
import { StateView } from '../components/StateView';
import { ListSkeleton } from '../components/Skeleton';
import { HeaderIconBadge } from '../components/HeaderIconBadge';
import { useAuth, useMyGroups, useNotifications } from '../hooks/useContexts';
import { useHomeSummary } from '../hooks/useHomeSummary';
import { greetingForHour } from '../utils/format';
import { BRAND, FONTS, spacing, useAppTheme } from '../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeMain'>,
  BottomTabScreenProps<TabParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { unreadNotifications, unreadMessages } = useNotifications();
  const { summary, error, refreshing, refresh: onRefresh } = useHomeSummary();
  const { groups } = useMyGroups();
  const now = new Date();
  const dateLabel = DATE_FORMAT.format(now);
  const username = user?.username ?? '';
  const pendingInGroups = groups.reduce((sum, group) => sum + (group.unreadCount ?? 0) + (group.unreadMessages ?? 0), 0);
  const heroMessage =
    pendingInGroups > 0
      ? `Tienes ${pendingInGroups === 1 ? '1 novedad' : `${pendingInGroups} novedades`} en tus grupos. Lumi ya encendió la luz.`
      : 'Tus grupos están en calma. Repasa un apunte, arma tu plan o enciende una sala de estudio.';

  const openGroup = (group: Group) =>
    navigation.navigate('Groups', { screen: 'GroupDetail', params: { groupId: group.id, group } });

  const openDocument = (document: DocumentItem) =>
    navigation.navigate('Library', { screen: 'DocumentDetail', params: { document } });

  const stats = [
    { label: 'materiales en la biblioteca', value: summary?.documents, onPress: () => navigation.navigate('Library') },
    { label: 'grupos de estudio', value: summary?.groups, onPress: () => navigation.navigate('Groups') },
    { label: 'planes generados por ti', value: summary?.plans, onPress: () => navigation.navigate('Planner') },
  ];

  return (
    <Screen safeTop refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: theme.colors.ink }]}>EDUQUEST</Text>
        {user ? (
          <View style={styles.headerActions}>
            <HeaderIconBadge
              icon="magnify"
              count={0}
              label="Buscar en EduQuest"
              onPress={() => navigation.navigate('GlobalSearch')}
            />
            <HeaderIconBadge
              icon="bell-outline"
              count={unreadNotifications}
              label="Notificaciones"
              onPress={() => navigation.navigate('Notifications')}
            />
            <HeaderIconBadge
              icon="message-text-outline"
              count={unreadMessages}
              label="Mensajes"
              onPress={() => navigation.navigate('Conversations')}
            />
            <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Ir a tu perfil">
              <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={40} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <NightSky style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <Text style={styles.heroDate}>{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</Text>
            <Text style={styles.heroGreeting}>{greetingForHour(now.getHours()).toUpperCase()},</Text>
            <Text
              style={[styles.heroName, username.length > 12 && styles.heroNameLong]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              accessibilityRole="header"
            >
              {username.toUpperCase()}
            </Text>
          </View>
          <Lumi mood={pendingInGroups > 0 ? 'cheer' : 'happy'} size={78} />
        </View>
        <Text style={styles.heroMessage}>{heroMessage}</Text>
        <View style={styles.heroButtons}>
          <Button
            mode="contained"
            buttonColor={BRAND.lumi}
            textColor={BRAND.noche}
            onPress={() => navigation.navigate('Planner')}
          >
            Generar mi plan
          </Button>
          <Button mode="contained" buttonColor="rgba(255,255,255,0.14)" textColor="#FFFFFF" onPress={() => navigation.navigate('Library')}>
            Ir a la biblioteca
          </Button>
        </View>
        <View style={styles.heroStats}>
          {stats.map((stat) => (
            <Pressable key={stat.label} onPress={stat.onPress} style={styles.heroStat} accessibilityRole="button">
              <Text style={styles.heroStatValue}>{stat.value ?? '–'}</Text>
              <Text variant="bodySmall" style={styles.heroStatLabel}>
                {stat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </NightSky>

      <VerifyEmailCard />

      <WeatherStrip />

      <Pressable
        onPress={() => navigation.navigate('FocusMode')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.focus, { opacity: pressed ? 0.9 : 1 }]}
      >
        <Lumi mood="focus" size={64} animated={false} />
        <View style={styles.focusText}>
          <Text style={styles.focusTitle}>Modo enfoque</Text>
          <Text variant="bodyMedium" style={styles.focusBody}>
            Pon el celular boca abajo y el temporizador arranca solo. Si lo levantas, se pausa.
          </Text>
        </View>
        <MaterialCommunityIcons name="cellphone-arrow-down" size={30} color={BRAND.lumi} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Calendar')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.calendar,
          { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={28} color={theme.colors.primary} />
        <View style={styles.focusText}>
          <Text variant="titleMedium" style={{ color: theme.colors.ink }}>
            Mi calendario
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            Las asesorías de todos tus grupos en un solo lugar
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Forum')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.calendar,
          { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="forum-outline" size={28} color={theme.colors.primary} />
        <View style={styles.focusText}>
          <Text variant="titleMedium" style={{ color: theme.colors.ink }}>
            Foro de preguntas
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
            Pregunta tus dudas por curso y ayuda a otros
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.muted} />
      </Pressable>

      {summary?.points !== null && summary?.points !== undefined ? (
        <Pressable
          onPress={() => navigation.navigate('Profile', { screen: 'Achievements' })}
          accessibilityRole="button"
          accessibilityLabel={`Tienes ${summary.points} puntos. Ver logros`}
          style={({ pressed }) => [
            styles.points,
            { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="trophy-outline" size={24} color={theme.colors.warning} />
          <Text variant="titleMedium" style={[styles.pointsText, { color: theme.colors.ink }]}>
            {summary.points} pts{summary.rank ? ` · puesto #${summary.rank}` : ''}
          </Text>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            Ver logros
          </Text>
        </Pressable>
      ) : null}

      {groups.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Tus grupos</Text>
            <Button compact onPress={() => navigation.navigate('Groups')}>
              Ver todos
            </Button>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
            {groups.slice(0, 8).map((group) => {
              const unread = (group.unreadCount ?? 0) + (group.unreadMessages ?? 0);
              return (
                <Pressable
                  key={group.id}
                  onPress={() => openGroup(group)}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.name}${unread > 0 ? `, ${unread} novedades` : ''}`}
                  style={({ pressed }) => [styles.tile, { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 }]}
                >
                  <GroupBanner group={group} height={64} />
                  <View style={styles.tileBody}>
                    <GroupAvatar group={group} size={44} radius={16} style={[styles.tileAvatar, { borderColor: theme.colors.surface }]} />
                    <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.ink }}>
                      {group.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: unread > 0 ? theme.colors.chicleInk : theme.colors.muted }}>
                      {unread > 0 ? `${unread} ${unread === 1 ? 'novedad' : 'novedades'}` : 'Al día'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Recién subido</Text>
        <Button compact onPress={() => navigation.navigate('Library')}>
          Ver biblioteca
        </Button>
      </View>

      {!summary && !error ? (
        <ListSkeleton count={3} label="Cargando lo último subido" />
      ) : error ? (
        <StateView kind="error" compact title="No pudimos cargar tu resumen" message={error} actionLabel="Reintentar" onAction={onRefresh} />
      ) : summary && summary.recent.length === 0 ? (
        <StateView
          kind="empty"
          compact
          title="La biblioteca está vacía"
          message="Sé la primera persona en compartir un apunte."
          actionLabel="Subir material"
          onAction={() => navigation.navigate('Library', { screen: 'UploadDocument' })}
        />
      ) : (
        summary?.recent.map((document) => (
          <DocumentRow key={document.id} document={document} onPress={openDocument} />
        ))
      )}
    </Screen>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  brand: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hero: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroText: {
    flex: 1,
  },
  heroDate: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: '#c8c4ff',
  },
  heroGreeting: {
    marginTop: spacing.sm,
    fontFamily: FONTS.displayHeavy,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  heroName: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
  },
  heroNameLong: {
    fontSize: 24,
    lineHeight: 30,
  },
  heroMessage: {
    marginTop: spacing.sm,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e0ff',
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  heroStatLabel: {
    color: '#c8c4ff',
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 20,
    marginTop: 14,
  },
  pointsText: {
    flex: 1,
  },
  focus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: 24,
    marginTop: spacing.lg,
    backgroundColor: '#24204f',
    borderWidth: 1,
    borderColor: 'rgba(255, 210, 94, 0.45)',
    shadowColor: BRAND.lumi,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  focusText: {
    flex: 1,
  },
  focusTitle: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: '#FFFFFF',
  },
  focusBody: {
    color: '#d6d9f2',
    marginTop: 2,
  },
  calendar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
  },
  tiles: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tile: {
    width: 150,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tileBody: {
    padding: spacing.sm + 2,
    gap: 2,
  },
  tileAvatar: {
    marginTop: -30,
    marginBottom: 4,
    borderWidth: 3,
  },
});
