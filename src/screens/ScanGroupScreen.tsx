import { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Group, GroupsStackParamList } from '../types';
import { StateView } from '../components/StateView';
import { JoinPasswordDialog } from '../components/JoinPasswordDialog';
import { useToast } from '../hooks/useContexts';
import { useGroupJoin } from '../hooks/useGroupJoin';
import { useGroupLookup } from '../hooks/useGroupLookup';
import { normalizeGroupCode, parseGroupQrValue, type GroupReference } from '../utils/groupQr';
import { getErrorMessage, getErrorStatus } from '../utils/errors';
import { spacing, useAppTheme } from '../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'ScanGroup'>;

export function ScanGroupScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const lockRef = useRef(false);

  const unlockLater = (delay = 1500) => {
    setTimeout(() => {
      lockRef.current = false;
    }, delay);
  };

  const onJoined = useCallback(
    (group: Group) => navigation.replace('GroupDetail', { groupId: group.id, group }),
    [navigation]
  );
  const onCancel = useCallback(() => {
    lockRef.current = false;
  }, []);
  const { start, joiningId, dialog } = useGroupJoin(onJoined, onCancel);
  const { lookup, looking } = useGroupLookup();

  const openReference = async (reference: GroupReference) => {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      const outcome = await start(await lookup(reference), reference.kind === 'code' ? reference.token : undefined);
      if (outcome === 'failed') unlockLater();
    } catch (error) {
      showToast(getErrorStatus(error) === 404 ? 'No encontramos ese grupo.' : getErrorMessage(error), 'error');
      unlockLater();
    }
  };

  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (lockRef.current) return;
    const reference = parseGroupQrValue(data);
    if (!reference) {
      lockRef.current = true;
      showToast('Ese QR no es de un grupo de EduQuest.', 'error');
      unlockLater(2000);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    openReference(reference);
  };

  const submitManual = () => {
    const reference = parseGroupQrValue(manualCode);
    if (!reference) {
      showToast('Escribe el código de 6 caracteres que aparece debajo del QR.', 'error');
      return;
    }
    openReference(reference);
  };

  const working = looking || joiningId !== null;
  const scanningPaused = working || dialog.visible;

  const manualEntry = (
    <View style={[styles.manual, { backgroundColor: theme.colors.surface }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.ink }}>
        ¿No puedes escanear? Escribe el código del grupo
      </Text>
      <View style={styles.manualRow}>
        <TextInput
          mode="outlined"
          dense
          value={manualCode}
          onChangeText={(text) => setManualCode(normalizeGroupCode(text))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          placeholder="Ej. K7P2QX"
          style={styles.manualInput}
        />
        <Button mode="contained" onPress={submitManual} loading={working} disabled={working || !manualCode}>
          Unirme
        </Button>
      </View>
    </View>
  );

  if (!permission) {
    return <StateView kind="loading" message="Preparando la cámara…" />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <StateView
          kind="empty"
          icon="camera-off-outline"
          title="Necesitamos tu cámara"
          message={
            permission.canAskAgain
              ? 'La usamos solo para leer el QR de un grupo. No guardamos fotos.'
              : 'Bloqueaste el permiso. Actívalo en los ajustes del teléfono o usa el código.'
          }
          actionLabel={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          onAction={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
        />
        <View style={styles.manualWrap}>{manualEntry}</View>
        <JoinPasswordDialog {...dialog} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanningPaused ? undefined : onBarcodeScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.frame, { borderColor: theme.colors.highlight }]} />
        <Text variant="titleMedium" style={styles.overlayText}>
          {working ? 'Buscando el grupo…' : 'Apunta al QR del grupo'}
        </Text>
      </View>
      <View style={styles.manualWrap}>{manualEntry}</View>
      <JoinPasswordDialog {...dialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 4,
    borderRadius: 28,
  },
  overlayText: {
    color: '#FFFFFF',
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  manualWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
  },
  manual: {
    padding: spacing.md,
    borderRadius: 18,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  manualInput: {
    flex: 1,
  },
});
