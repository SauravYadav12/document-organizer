import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from 'react-native-document-scanner-plugin';

import { palette, spacing } from '../../ui/theme';
import type { CaptureStackParamList } from '../../navigation/screens';

type Nav = NativeStackNavigationProp<CaptureStackParamList, 'Capture'>;
type ErrorKind = 'permission' | 'generic' | 'empty';

export function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const launchedRef = useRef(false);

  const leaveCapture = useCallback(() => {
    navigation.getParent()?.navigate('LibraryTab');
  }, [navigation]);

  const launchScanner = useCallback(async () => {
    if (launchedRef.current) return;
    launchedRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
        responseType: ResponseType.ImageFilePath,
      });

      if (status === ScanDocumentResponseStatus.Cancel) {
        leaveCapture();
        return;
      }

      const first = scannedImages?.[0];
      if (!first) {
        setError('empty');
        return;
      }
      navigation.navigate('ConfirmDate', { photoUri: normalizeUri(first) });
    } catch (err) {
      setError(isPermissionError(err) ? 'permission' : 'generic');
    } finally {
      setBusy(false);
    }
  }, [navigation, leaveCapture]);

  function retry() {
    launchedRef.current = false;
    launchScanner();
  }

  // Auto-launch only on first focus of this screen. After an error or cancel
  // the user must press "Open scanner" explicitly — otherwise returning to the
  // tab would re-trigger the permission prompt on every focus.
  useFocusEffect(
    useCallback(() => {
      if (launchedRef.current) return;
      launchScanner();
    }, [launchScanner]),
  );

  // Reset the one-shot latch if the user pops this screen entirely.
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      launchedRef.current = false;
    });
  }, [navigation]);

  const errorCopy = error ? ERROR_COPY[error] : null;

  return (
    <View style={styles.container}>
      {busy ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      <Text style={styles.message}>
        {busy ? 'Opening scanner…' : errorCopy?.title ?? 'Preparing scanner…'}
      </Text>
      {!busy && errorCopy ? (
        <Text style={styles.detail}>{errorCopy.detail}</Text>
      ) : null}
      {!busy ? (
        <View style={styles.actions}>
          {error === 'permission' ? (
            <Button mode="contained" onPress={() => Linking.openSettings()}>
              Open settings
            </Button>
          ) : (
            <Button mode="contained" onPress={retry}>
              Open scanner
            </Button>
          )}
          <Button mode="text" onPress={leaveCapture} textColor={palette.onSurfaceVariant}>
            Cancel
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const ERROR_COPY: Record<ErrorKind, { title: string; detail: string }> = {
  permission: {
    title: 'Camera access is off',
    detail:
      'DocOrg needs camera access to scan documents. Enable it in Settings and come back.',
  },
  generic: {
    title: 'Scanner could not start',
    detail: 'Try again, or come back in a moment.',
  },
  empty: {
    title: 'No usable scan',
    detail: 'Try again with better lighting and the document flat in frame.',
  },
};

function isPermissionError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : typeof (err as { message?: unknown })?.message === 'string'
          ? (err as { message: string }).message
          : '';
  return /permission|denied|unauthoriz/i.test(msg);
}

function normalizeUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('http')) return uri;
  return `file://${uri}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  message: {
    color: palette.onSurface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  detail: {
    color: palette.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { gap: spacing.sm, alignItems: 'center' },
});
