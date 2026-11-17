import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BrandMark } from '../components/BrandMark';
import { AppealCard } from '../components/AppealCard';
import { useAuth } from '../hooks/useContexts';
import { formatDateTime } from '../utils/format';
import { FONTS, spacing, useAppTheme } from '../theme';

const RULES = [
  'Compartir solo material académico y propio o con permiso de su autor.',
  'Tratar con respeto a los demás estudiantes en grupos y reseñas.',
  'No publicar spam, publicidad ni contenido ofensivo.',
];

export function BannedScreen() {
  const theme = useAppTheme();
  const { banInfo, dismissBan } = useAuth();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <BrandMark size={20} color={theme.colors.ink} />
        </View>

        <View style={[styles.iconCircle, { backgroundColor: theme.colors.errorContainer }]}>
          <MaterialCommunityIcons name="account-cancel-outline" size={44} color={theme.colors.error} />
        </View>

        <Text style={[styles.title, { color: theme.colors.ink }]}>Tu cuenta fue suspendida</Text>
        <Text variant="bodyLarge" style={[styles.lead, { color: theme.colors.onSurfaceVariant }]}>
          {banInfo?.bannedUntil
            ? `La moderación suspendió tu cuenta por incumplir las normas de la comunidad. Podrás volver a entrar el ${formatDateTime(banInfo.bannedUntil)}.`
            : 'Un administrador vetó tu cuenta por incumplir las normas de la comunidad. Mientras el veto siga activo no podrás usar EduQuest.'}
        </Text>

        <View
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
          accessibilityLabel={`Motivo: ${banInfo?.reason ?? 'no indicado'}`}
        >
          <Text variant="labelLarge" style={{ color: theme.colors.muted }}>
            Motivo
          </Text>
          <Text variant="bodyLarge" style={[styles.reason, { color: theme.colors.ink }]}>
            {banInfo?.reason || 'El administrador no dejó un detalle.'}
          </Text>
          {banInfo?.bannedAt ? (
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.muted} />
              <Text variant="bodySmall" style={{ color: theme.colors.muted }}>
                Desde el {formatDateTime(banInfo.bannedAt)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text variant="titleSmall" style={[styles.rulesTitle, { color: theme.colors.ink }]}>
          Normas de EduQuest
        </Text>
        {RULES.map((rule) => (
          <View key={rule} style={styles.ruleRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={[styles.ruleText, { color: theme.colors.onSurfaceVariant }]}>
              {rule}
            </Text>
          </View>
        ))}

        <AppealCard />

        <Button mode="contained" icon="arrow-left" onPress={dismissBan} style={styles.button} contentStyle={styles.buttonContent}>
          Volver al inicio
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: FONTS.displayHeavy,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  lead: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reason: {
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  rulesTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 6,
  },
  ruleText: {
    flex: 1,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
