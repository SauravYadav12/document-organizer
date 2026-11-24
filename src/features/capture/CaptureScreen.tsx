import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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

export function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const launchedRef = useRef(false);

  const launchScanner = useCallback(async () => {
    if (launchedRef.current) return;
    launchedRef.current = true;
    setBusy(true);
    setErrorMsg(null);
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
        setErrorMsg('No usable scan was produced. Try again with better lighting.');
        return;
      }
      navigation.navigate('ConfirmDate', { photoUri: normalizeUri(first) });
    } catch (err) {
      setErrorMsg('Scanner could not start. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [navigation]);

  function leaveCapture() {
    navigation.getParent()?.navigate('LibraryTab');
  }

  function retry() {
    launchedRef.current = false;
    launchScanner();
  }

  useFocusEffect(
    useCallback(() => {
      launchedRef.current = false;
      launchScanner();
      return () => {
        launchedRef.current = false;
      };
    }, [launchScanner]),
  );

  useEffect(() => {
    if (errorMsg) {
      Alert.alert('Scan unusable', errorMsg, [
        { text: 'Cancel', style: 'cancel', onPress: leaveCapture },
        { text: 'Try again', onPress: retry },
      ]);
    }
  }, [errorMsg]);

  return (
    <View style={styles.container}>
      {busy ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      <Text style={styles.message}>
        {busy ? 'Opening scanner…' : 'Preparing scanner…'}
      </Text>
      {!busy ? (
        <View style={styles.actions}>
          <Button mode="contained" onPress={retry}>
            Open scanner
          </Button>
          <Button mode="text" onPress={leaveCapture} textColor={palette.onSurfaceVariant}>
            Cancel
          </Button>
        </View>
      ) : null}
    </View>
  );
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
    color: palette.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: { gap: spacing.sm, alignItems: 'center' },
});
