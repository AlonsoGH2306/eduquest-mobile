import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resendVerification, verifyEmail } from '../services/authService';
import { useAuth, useToast } from '../hooks/useContexts';
import { getErrorMessage } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

export function VerifyEmailCard() {
  const theme = useAppTheme();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user || user.emailVerified !== false) return null;

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      showToast('El código tiene 6 dígitos', 'error');
      return;
    }
    setVerifying(true);
    try {
      await verifyEmail(code);
      await updateProfile({ ...user, emailVerified: true });
      showToast('¡Correo verificado! Ya puedes publicar y escribir', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await resendVerification();
      showToast(`Te enviamos un código nuevo a ${user.email}`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.highlight }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="email-check-outline" size={22} color={theme.colors.onHighlight} />
        <Text variant="titleSmall" style={{ color: theme.colors.onHighlight, flex: 1 }}>
          Confirma tu correo
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onHighlight, marginTop: 4 }}>
        Ingresa el código que enviamos a {user.email}. Mientras tanto solo puedes leer.
      </Text>
      <View style={styles.row}>
        <TextInput
          mode="outlined"
          dense
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="000000"
          style={styles.input}
          accessibilityLabel="Código de verificación"
        />
        <Button mode="contained" onPress={verify} loading={verifying} disabled={verifying}>
          Verificar
        </Button>
      </View>
      <Button compact onPress={resend} loading={resending} disabled={resending} textColor={theme.colors.onHighlight}>
        Reenviar código
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    letterSpacing: 6,
  },
});
