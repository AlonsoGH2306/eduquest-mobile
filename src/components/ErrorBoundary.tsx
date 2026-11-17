import { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de interfaz', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Esta pantalla dejó de responder
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          Tus datos están a salvo. Vuelve a intentarlo y, si se repite, cierra y abre la app.
        </Text>
        <Button mode="contained" onPress={() => this.setState({ hasError: false })}>
          Intentar de nuevo
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginVertical: 12,
    maxWidth: 300,
  },
});
