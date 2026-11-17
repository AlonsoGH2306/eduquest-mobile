import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, IconButton, Text } from 'react-native-paper';
import type { StudySession } from '../types';
import { formatDateTime } from '../utils/format';
import { buildGoogleCalendarUrl } from '../utils/calendar';
import { FONTS, spacing, useAppTheme } from '../theme';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

interface SessionCardProps {
  session: StudySession;
  busy?: boolean;
  onOpenLinkError?: () => void;
  onEdit?: (session: StudySession) => void;
  onDelete?: (session: StudySession) => void;
  onToggleAttendance?: (session: StudySession) => void;
  onCheckIn?: (session: StudySession) => void;
  onReview?: (session: StudySession) => void;
  onShowReviews?: (session: StudySession) => void;
  onEditRecording?: (session: StudySession) => void;
}

export function SessionCard({
  session,
  busy = false,
  onOpenLinkError,
  onEdit,
  onDelete,
  onToggleAttendance,
  onCheckIn,
  onReview,
  onShowReviews,
  onEditRecording,
}: SessionCardProps) {
  const theme = useAppTheme();
  const date = new Date(session.scheduledAt);
  const isPast = session.finished;
  const live = session.checkInOpen;
  const endTime = new Date(session.endsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const joinNow = async () => {
    if (!session.checkedIn) onCheckIn?.(session);
    await openMeeting();
  };

  const watchRecording = async () => {
    if (!session.recordingUrl) return;
    try {
      await Linking.openURL(session.recordingUrl);
    } catch {
      onOpenLinkError?.();
    }
  };

  const openMeeting = async () => {
    if (!session.meetingUrl) return;
    try {
      await Linking.openURL(session.meetingUrl);
    } catch {
      onOpenLinkError?.();
    }
  };

  const addToCalendar = async () => {
    try {
      await Linking.openURL(buildGoogleCalendarUrl(session));
    } catch {
      onOpenLinkError?.();
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={[styles.dateBlock, { backgroundColor: isPast ? theme.colors.surfaceVariant : theme.colors.highlight }]}>
        <Text style={[styles.day, { color: isPast ? theme.colors.muted : theme.colors.onHighlight }]}>
          {date.getDate()}
        </Text>
        <Text variant="labelMedium" style={{ color: isPast ? theme.colors.muted : theme.colors.onHighlight }}>
          {MONTHS[date.getMonth()]}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.ink }]}>
            {session.title}
          </Text>
          {session.canManage && (onEdit || onDelete) ? (
            <View style={styles.manage}>
              {onEdit && !session.started ? (
                <IconButton
                  icon="pencil-outline"
                  size={18}
                  onPress={() => onEdit(session)}
                  accessibilityLabel={`Editar ${session.title}`}
                  style={styles.iconButton}
                />
              ) : null}
              {onDelete ? (
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => onDelete(session)}
                  accessibilityLabel={`Eliminar ${session.title}`}
                  style={styles.iconButton}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.muted, marginTop: 2 }}>
          {formatDateTime(session.scheduledAt)} – {endTime}
          {isPast ? ', finalizada' : live && session.started ? ', en curso' : ''}
        </Text>
        {session.createdByUsername ? (
          <View style={styles.hostRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
              Dicta @{session.createdByUsername}
            </Text>
            {session.createdByAdvisor ? (
              <View style={[styles.advisor, { backgroundColor: theme.colors.highlight }]}>
                <MaterialCommunityIcons name="school-outline" size={11} color={theme.colors.onHighlight} />
                <Text style={[styles.advisorText, { color: theme.colors.onHighlight }]}>Asesor</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {session.description ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
            {session.description}
          </Text>
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="account-check-outline" size={14} color={theme.colors.muted} />
            <Text variant="labelMedium" style={{ color: theme.colors.muted }}>
              {session.attendeeCount} {session.attendeeCount === 1 ? 'confirmado' : 'confirmados'}
            </Text>
          </View>
          {session.started ? (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="account-multiple-check-outline" size={14} color={theme.colors.success} />
              <Text variant="labelMedium" style={{ color: theme.colors.muted }}>
                {session.checkedInCount} {session.checkedInCount === 1 ? 'asistió' : 'asistieron'}
              </Text>
            </View>
          ) : null}
          {session.reviewCount > 0 && session.averageRating !== null ? (
            <Pressable
              onPress={() => onShowReviews?.(session)}
              style={styles.stat}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${session.reviewCount} reseñas`}
            >
              <MaterialCommunityIcons name="star" size={14} color={theme.colors.warning} />
              <Text variant="labelMedium" style={{ color: theme.colors.warning }}>
                {session.averageRating.toFixed(1)} ({session.reviewCount})
              </Text>
            </Pressable>
          ) : null}
        </View>
        {live ? (
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon={session.checkedIn ? 'video-outline' : 'login'}
              compact
              loading={busy}
              disabled={busy}
              onPress={joinNow}
            >
              {session.checkedIn ? 'Volver a la llamada' : 'Unirme ahora'}
            </Button>
            {session.checkedIn ? (
              <Text variant="labelMedium" style={[styles.liveNote, { color: theme.colors.primary }]}>
                Asistencia registrada
              </Text>
            ) : session.attending ? (
              <Text variant="labelMedium" style={[styles.liveNote, { color: theme.colors.muted }]}>
                Confirmaste: entra para no perder puntos
              </Text>
            ) : null}
          </View>
        ) : !isPast ? (
          <View style={styles.actions}>
            {onToggleAttendance ? (
              <Button
                mode={session.attending ? 'contained' : 'outlined'}
                icon={session.attending ? 'check-circle' : 'check-circle-outline'}
                compact
                loading={busy}
                disabled={busy}
                onPress={() => onToggleAttendance(session)}
              >
                {session.attending ? 'Asistirás' : 'Confirmar asistencia'}
              </Button>
            ) : null}
            <Button
              mode="outlined"
              icon="calendar-plus"
              compact
              onPress={addToCalendar}
              accessibilityLabel={`Añadir ${session.title} a Google Calendar`}
            >
              Google Calendar
            </Button>
          </View>
        ) : (
          <View style={styles.actions}>
            {session.canReview && onReview ? (
              <Button mode="contained" icon="star-outline" compact onPress={() => onReview(session)}>
                Calificar
              </Button>
            ) : null}
            {session.recordingUrl ? (
              <Button mode="contained-tonal" icon="play-circle-outline" compact onPress={watchRecording}>
                Ver grabación
              </Button>
            ) : null}
            {session.canManage && onEditRecording ? (
              <Button mode="outlined" icon="youtube" compact onPress={() => onEditRecording(session)}>
                {session.recordingUrl ? 'Cambiar grabación' : 'Adjuntar grabación'}
              </Button>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  liveNote: {
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  dateBlock: {
    width: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  day: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 24,
    lineHeight: 28,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
  },
  manage: {
    flexDirection: 'row',
    marginTop: -8,
    marginRight: -8,
  },
  iconButton: {
    margin: 0,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  advisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  advisorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 10,
  },
});
