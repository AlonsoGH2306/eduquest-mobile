import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { BrandMark } from '../components/BrandMark';
import { Lumi } from '../components/Lumi';
import { NightSky } from '../components/NightSky';
import { useForm } from '../hooks/useForm';
import { useAuth, useToast } from '../hooks/useContexts';
import { validateLogin } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { FONTS, spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const INITIAL_VALUES = { username: '', password: '' };

export function LoginScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { login, sessionExpired } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm(INITIAL_VALUES, validateLogin);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login({ username: values.username.trim(), password: values.password });
      showToast(`Hola de nuevo, ${values.username.trim()}`, 'success');
    } catch (error) {
      form.applyServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen safeTop contentStyle={styles.content}>
      <NightSky style={styles.hero}>
        <BrandMark size={18} />
        <View style={styles.heroLumi}>
          <Lumi mood="happy" size={92} label="Lumi, la luciérnaga de EduQuest" />
        </View>
        <Text style={styles.heroTitle}>ESTUDIAR JUNTOS ILUMINA</Text>
        <Text variant="bodyLarge" style={styles.heroLead}>
          Tus apuntes, tus grupos de estudio y tu plan del ciclo en un solo lugar.
        </Text>
      </NightSky>

      <Text style={[styles.formTitle, { color: theme.colors.ink }]} accessibilityRole="header">
        Iniciar sesión
      </Text>

      {sessionExpired ? (
        <View style={[styles.notice, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
            Tu sesión expiró. Ingresa otra vez para continuar.
          </Text>
        </View>
      ) : null}

      <FormField
        label="Usuario"
        value={form.values.username}
        onChangeText={(text) => form.setField('username', text)}
        error={form.errors.username}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        left={<TextInput.Icon icon="account-outline" />}
      />
      <FormField
        label="Contraseña"
        value={form.values.password}
        onChangeText={(text) => form.setField('password', text)}
        error={form.errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword((value) => !value)}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          />
        }
      />

      <Button
        mode="text"
        compact
        onPress={() => navigation.navigate('ForgotPassword')}
        disabled={form.submitting}
        style={styles.forgot}
      >
        ¿Olvidaste tu contraseña?
      </Button>

      {formError ? (
        <Text variant="bodyMedium" style={[styles.formError, { color: theme.colors.error }]} accessibilityLiveRegion="polite">
          {formError}
        </Text>
      ) : null}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={form.submitting}
        disabled={form.submitting}
        contentStyle={styles.buttonContent}
        style={styles.button}
      >
        {form.submitting ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          ¿Primera vez en EduQuest?
        </Text>
        <Button mode="text" compact onPress={() => navigation.navigate('Register')} disabled={form.submitting}>
          Crear cuenta
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
  },
  content: {
    paddingTop: spacing.sm,
  },
  hero: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroLumi: {
    marginTop: spacing.md,
  },
  heroTitle: {
    marginTop: spacing.md,
    fontFamily: FONTS.displayHeavy,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
    maxWidth: 280,
  },
  heroLead: {
    marginTop: spacing.sm,
    color: '#d6d9f2',
    maxWidth: 300,
  },
  formTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  notice: {
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  formError: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
