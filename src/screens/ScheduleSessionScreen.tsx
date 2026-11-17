import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupsStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { useToast } from '../hooks/useContexts';
import { useSessionActions } from '../hooks/useSessionActions';
import { formatDateTime, toBackendDateTime } from '../utils/format';
import { URL_PATTERN } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { generateJitsiLink } from '../utils/meetingLinks';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'ScheduleSession'>;

const defaultDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date;
};

const DURATIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1 h 30' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
];

const durationOf = (start: string, end: string) =>
  Math.max(Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000), 15);

export function ScheduleSessionScreen({ route, navigation }: Props) {
  const { groupId, groupName, session } = route.params;
  const isEditing = Boolean(session);
  const { saveSession, saving } = useSessionActions(groupId);
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [title, setTitle] = useState(session?.title ?? '');
  const [description, setDescription] = useState(session?.description ?? '');
  const [meetingUrl, setMeetingUrl] = useState(session?.meetingUrl ?? '');
  const [scheduledAt, setScheduledAt] = useState<Date>(() =>
    session ? new Date(session.scheduledAt) : defaultDate()
  );
  const [duration, setDuration] = useState(() =>
    session ? durationOf(session.scheduledAt, session.endsAt) : 60
  );
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const errors = {
    title: serverErrors.title || (!title.trim() ? 'Ponle un título a la sesión.' : title.length > 150 ? 'Máximo 150 caracteres.' : undefined),
    scheduledAt:
      serverErrors.scheduledAt || (scheduledAt.getTime() <= Date.now() ? 'Elige una fecha y hora futura.' : undefined),
    meetingUrl:
      serverErrors.meetingUrl ||
      (!meetingUrl.trim()
        ? 'Pega el enlace de la llamada para que todos puedan entrar.'
        : !URL_PATTERN.test(meetingUrl.trim())
          ? 'El enlace debe empezar con http:// o https://'
          : undefined),
  };
  const isValid = !errors.title && !errors.scheduledAt && !errors.meetingUrl;

  const pickAndroid = () => {
    DateTimePickerAndroid.open({
      value: scheduledAt,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event: DateTimePickerEvent, date?: Date) => {
        if (event.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
            if (timeEvent.type !== 'set' || !time) return;
            const next = new Date(date);
            next.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setScheduledAt(next);
            setServerErrors((previous) => ({ ...previous, scheduledAt: '' }));
          },
        });
      },
    });
  };

  const onSubmit = async () => {
    setTouched(true);
    if (!isValid || saving) return;
    setFormError(null);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      scheduledAt: toBackendDateTime(scheduledAt),
      endsAt: toBackendDateTime(new Date(scheduledAt.getTime() + duration * 60000)),
      meetingUrl: meetingUrl.trim(),
    };
    try {
      await saveSession(payload, session?.id);
      showToast(isEditing ? 'Sesión actualizada' : 'Sesión agendada', 'success');
      navigation.goBack();
    } catch (error) {
      setServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Screen>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.muted }]}>
        {isEditing
          ? `Los cambios se verán al instante para todos los miembros de ${groupName}.`
          : `Todos los miembros de ${groupName} verán la sesión y su enlace.`}
      </Text>

      <FormField
        label="Tema de la sesión"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setServerErrors((previous) => ({ ...previous, title: '' }));
        }}
        error={touched || title ? errors.title : undefined}
        placeholder="Ej. Repaso para el parcial de DBP"
        maxLength={150}
      />
      <FormField
        label="Qué van a revisar (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Fecha y hora
      </Text>
      {Platform.OS === 'android' ? (
        <Pressable
          onPress={pickAndroid}
          accessibilityRole="button"
          style={[styles.dateButton, { borderColor: errors.scheduledAt ? theme.colors.error : theme.colors.outline }]}
        >
          <MaterialCommunityIcons name="calendar-clock" size={22} color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            {formatDateTime(scheduledAt.toISOString())}
          </Text>
        </Pressable>
      ) : (
        <DateTimePicker
          value={scheduledAt}
          mode="datetime"
          display="compact"
          minimumDate={new Date()}
          onChange={(_event, date) => date && setScheduledAt(date)}
          style={styles.iosPicker}
        />
      )}
      <HelperText type="error" visible={Boolean(errors.scheduledAt)} padding="none">
        {errors.scheduledAt}
      </HelperText>

      <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Duración
      </Text>
      <View style={styles.durations}>
        {DURATIONS.map((option) => (
          <Chip
            key={option.minutes}
            selected={duration === option.minutes}
            showSelectedCheck={false}
            mode={duration === option.minutes ? 'flat' : 'outlined'}
            onPress={() => setDuration(option.minutes)}
          >
            {option.label}
          </Chip>
        ))}
      </View>
      <HelperText type="info" visible padding="none">
        Podrán marcar asistencia con «Unirme ahora» desde 10 minutos antes hasta que termine.
      </HelperText>

      <FormField
        label="Enlace de la reunión"
        value={meetingUrl}
        onChangeText={(text) => {
          setMeetingUrl(text);
          setServerErrors((previous) => ({ ...previous, meetingUrl: '' }));
        }}
        error={touched || meetingUrl ? errors.meetingUrl : undefined}
        hint="Meet, Zoom o Discord."
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        left={<TextInput.Icon icon="video-outline" />}
      />
      <View style={styles.meetActions}>
        <Button
          mode="contained-tonal"
          icon="auto-fix"
          compact
          onPress={() => {
            setMeetingUrl(generateJitsiLink(title));
            setServerErrors((previous) => ({ ...previous, meetingUrl: '' }));
          }}
        >
          Generar enlace
        </Button>
        <Button
          mode="text"
          icon="video-plus-outline"
          compact
          onPress={() => Linking.openURL('https://meet.google.com/new').catch(() => undefined)}
        >
          o crear un Meet
        </Button>
      </View>
      <HelperText type="info" visible padding="none">
        El enlace generado usa Jitsi Meet: gratis y sin cuenta.
      </HelperText>

      {formError ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {formError}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon={isEditing ? 'content-save-outline' : 'calendar-check'}
          onPress={onSubmit}
          loading={saving}
          disabled={saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Agendar sesión'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  durations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  intro: {
    marginBottom: spacing.md,
  },
  label: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  meetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -4,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: spacing.lg,
  },
  button: {
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
