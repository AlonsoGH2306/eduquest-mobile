import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { ScreenTitle } from '../components/ScreenTitle';
import { FormField } from '../components/FormField';
import * as authService from '../services/authService';
import { useToast } from '../hooks/useContexts';
import { EMAIL_PATTERN, PASSWORD_PATTERN } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

interface Props {
  route: { params?: { email?: string } };
}

export function ForgotPasswordScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailError = !EMAIL_PATTERN.test(email.trim()) ? 'Escribe un correo válido.' : null;
  const codeError = !/^\d{6}$/.test(code.trim()) ? 'El código tiene 6 dígitos.' : null;
  const passwordError =
    password.length < 8
      ? 'Usa al menos 8 caracteres.'
      : !PASSWORD_PATTERN.test(password)
        ? 'Incluye al menos una letra y un número.'
        : null;
  const confirmError = confirm !== password ? 'Las contraseñas no coinciden.' : null;

  const sendCode = async () => {
    setTouched(true);
    if (emailError || sending) return;
    setSending(true);
    setServerError(null);
    try {
      await authService.forgotPassword(email.trim());
      showToast('Si el correo está registrado, te llegará un código.', 'success');
      setStep('reset');
      setTouched(false);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const savePassword = async () => {
    setTouched(true);
    if (codeError || passwordError || confirmError || sending) return;
    setSending(true);
    setServerError(null);
    try {
      await authService.resetPassword({ email: email.trim(), code: code.trim(), password });
      showToast('¡Listo! Ya puedes usar tu nueva contraseña.', 'success');
      navigation.goBack();
    } catch (err) {
      const fields = getFieldErrors(err);
      setServerError(Object.values(fields)[0] ?? getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const eye = (
    <TextInput.Icon
      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
      onPress={() => setShowPassword((value) => !value)}
      accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    />
  );

  return (
    <Screen>
      <ScreenTitle
        title={step === 'email' ? '¿Olvidaste tu contraseña?' : 'Nueva contraseña'}
        subtitle={
          step === 'email'
            ? 'Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.'
            : `Escribe el código que enviamos a ${email.trim()}. Vence en 15 minutos.`
        }
      />

      {step === 'email' ? (
        <FormField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          error={touched ? (emailError ?? undefined) : undefined}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          left={<TextInput.Icon icon="email-outline" />}
        />
      ) : (
        <>
          <FormField
            label="Código"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            error={touched ? (codeError ?? undefined) : undefined}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            left={<TextInput.Icon icon="shield-key-outline" />}
          />
          <FormField
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            error={touched ? (passwordError ?? undefined) : undefined}
            hint="Mínimo 8 caracteres, con letras y números."
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-outline" />}
            right={eye}
          />
          <FormField
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            error={touched ? (confirmError ?? undefined) : undefined}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-check-outline" />}
          />
        </>
      )}

      {serverError ? (
        <Text variant="bodyMedium" style={[styles.error, { color: theme.colors.error }]}>
          {serverError}
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon={step === 'email' ? 'send' : 'key-variant'}
        onPress={step === 'email' ? sendCode : savePassword}
        loading={sending}
        disabled={sending}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {step === 'email' ? 'Enviarme el código' : 'Cambiar contraseña'}
      </Button>

      {step === 'reset' ? (
        <View style={styles.links}>
          <Button compact onPress={() => setStep('email')} disabled={sending}>
            Usar otro correo
          </Button>
          <Button compact onPress={sendCode} disabled={sending}>
            Reenviar código
          </Button>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
