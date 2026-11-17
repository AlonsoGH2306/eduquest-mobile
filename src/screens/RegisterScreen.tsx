import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, List, Switch, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { Screen } from '../components/Screen';
import { FormField } from '../components/FormField';
import { ScreenTitle } from '../components/ScreenTitle';
import { useForm } from '../hooks/useForm';
import { useAuth, useToast } from '../hooks/useContexts';
import { validateRegister } from '../utils/validation';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const INITIAL_VALUES = { username: '', email: '', password: '', confirmPassword: '' };

export function RegisterScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [advisor, setAdvisor] = useState(false);
  const form = useForm(INITIAL_VALUES, validateRegister);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        advisor,
      });
      showToast('Cuenta creada. Revisa tu correo de bienvenida.', 'success');
    } catch (error) {
      form.applyServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        title="Crea tu cuenta"
        subtitle="Con tu cuenta puedes compartir material, unirte a grupos y generar planes de estudio."
      />

      <FormField
        label="Usuario"
        value={form.values.username}
        onChangeText={(text) => form.setField('username', text)}
        error={form.errors.username}
        hint="Así te verán tus compañeros. Entre 3 y 50 caracteres."
        autoCapitalize="none"
        autoCorrect={false}
        left={<TextInput.Icon icon="account-outline" />}
      />
      <FormField
        label="Correo"
        value={form.values.email}
        onChangeText={(text) => form.setField('email', text)}
        error={form.errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        left={<TextInput.Icon icon="email-outline" />}
      />
      <FormField
        label="Contraseña"
        value={form.values.password}
        onChangeText={(text) => form.setField('password', text)}
        error={form.errors.password}
        hint="Mínimo 8 caracteres, con letras y números."
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword((value) => !value)}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          />
        }
      />
      <FormField
        label="Confirmar contraseña"
        value={form.values.confirmPassword}
        onChangeText={(text) => form.setField('confirmPassword', text)}
        error={form.errors.confirmPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        left={<TextInput.Icon icon="lock-check-outline" />}
      />

      <List.Item
        title="Quiero ser asesor"
        description="Podrás dictar asesorías y se verá una insignia junto a tu nombre."
        descriptionNumberOfLines={2}
        left={(props) => <List.Icon {...props} icon="school-outline" />}
        right={() => <Switch value={advisor} onValueChange={setAdvisor} />}
        onPress={() => setAdvisor((value) => !value)}
        style={[styles.advisor, { backgroundColor: theme.colors.surfaceVariant }]}
      />

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
        {form.submitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.muted }}>
          ¿Ya tienes cuenta?
        </Text>
        <Button mode="text" compact onPress={() => navigation.goBack()} disabled={form.submitting}>
          Iniciar sesión
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  advisor: {
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  content: {
    paddingTop: spacing.lg,
  },
  formError: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 14,
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
