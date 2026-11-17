import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput, TextInputProps } from 'react-native-paper';

interface FormFieldProps extends Omit<TextInputProps, 'error' | 'mode'> {
  error?: string;
  hint?: string;
}

export function FormField({ error, hint, style, ...inputProps }: FormFieldProps) {
  const helper = error ?? hint;
  return (
    <View style={styles.field}>
      <TextInput mode="outlined" error={Boolean(error)} style={[styles.input, style]} {...inputProps} />
      {helper ? (
        <HelperText type={error ? 'error' : 'info'} visible padding="none">
          {helper}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
