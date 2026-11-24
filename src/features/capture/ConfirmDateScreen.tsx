import React, { useState } from 'react';
import { StyleSheet, View, Platform, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp, CommonActions } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from 'react-native-document-scanner-plugin';

import { DateConfirmCard } from './DateConfirmCard';
import { useCaptureFlow } from './useCaptureFlow';
import { palette, radii, spacing } from '../../ui/theme';
import { useSnackbar } from '../../ui/SnackbarHost';
import type { CaptureStackParamList } from '../../navigation/screens';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ConfirmDateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CaptureStackParamList, 'ConfirmDate'>>();
  const insets = useSafeAreaInsets();
  const showSnackbar = useSnackbar((s) => s.show);
  const [currentUri, setCurrentUri] = useState(route.params.photoUri);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const {
    isDetecting,
    detectedDate,
    detectionSource,
    detectedTitle,
    overrideDate,
    overrideTitle,
    saveCapturedDocument,
  } = useCaptureFlow(currentUri);

  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);

  React.useEffect(() => {
    if (!titleEdited && detectedTitle) {
      setTitleDraft(detectedTitle);
    }
  }, [detectedTitle, titleEdited]);

  function handleTitleChange(value: string) {
    setTitleEdited(true);
    setTitleDraft(value);
    overrideTitle(value);
  }

  async function rotate(deg: 90 | -90) {
    if (isAdjusting) return;
    setIsAdjusting(true);
    try {
      const result = await manipulateAsync(currentUri, [{ rotate: deg }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      setCurrentUri(result.uri);
    } catch {
      showSnackbar({ message: 'Could not rotate image', kind: 'error' });
    } finally {
      setIsAdjusting(false);
    }
  }

  async function rescan() {
    if (isAdjusting) return;
    setIsAdjusting(true);
    try {
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
        responseType: ResponseType.ImageFilePath,
      });
      if (status === ScanDocumentResponseStatus.Success && scannedImages?.[0]) {
        const uri = scannedImages[0];
        const normalized = uri.startsWith('file://') ? uri : `file://${uri}`;
        setCurrentUri(normalized);
      }
    } catch {
      showSnackbar({ message: 'Could not re-open scanner', kind: 'error' });
    } finally {
      setIsAdjusting(false);
    }
  }

  function handleDatePicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) overrideDate(selected);
  }

  async function handleConfirm() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const doc = await saveCapturedDocument();
      showSnackbar({
        message: `Saved to ${MONTH_LABELS[doc.documentMonth - 1]} ${doc.documentYear}`,
        kind: 'success',
      });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'LibraryTab' }],
        }),
      );
    } catch (err) {
      showSnackbar({ message: 'Could not save the document', kind: 'error' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.topTitle}>Confirm</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrapper}>
          <ExpoImage source={currentUri} contentFit="cover" style={styles.preview} transition={200} />
        </View>

        <View style={styles.adjustRow}>
          <IconButton
            icon="rotate-left"
            mode="outlined"
            size={20}
            onPress={() => rotate(-90)}
            disabled={isAdjusting}
            accessibilityLabel="Rotate left"
          />
          <IconButton
            icon="rotate-right"
            mode="outlined"
            size={20}
            onPress={() => rotate(90)}
            disabled={isAdjusting}
            accessibilityLabel="Rotate right"
          />
          <Button
            mode="outlined"
            icon="crop"
            onPress={rescan}
            disabled={isAdjusting}
            textColor={palette.primary}
            style={styles.rescanButton}
          >
            Re-scan
          </Button>
        </View>

        <View style={styles.body}>
          <TextInput
            label="Title"
            value={titleDraft}
            onChangeText={handleTitleChange}
            placeholder={isDetecting ? 'Detecting…' : 'e.g. "Gupta Sales Corporation"'}
            mode="outlined"
            outlineColor={palette.outline}
            activeOutlineColor={palette.primary}
            style={styles.titleInput}
            right={
              detectedTitle && titleDraft === detectedTitle ? (
                <TextInput.Icon icon="check-circle" color={palette.primary} />
              ) : undefined
            }
          />
          {detectedTitle && titleDraft === detectedTitle ? (
            <Text style={styles.titleHint}>Auto-detected from the document</Text>
          ) : null}

          <DateConfirmCard date={detectedDate} source={detectionSource} isDetecting={isDetecting} />

          <View style={styles.changeRow}>
            <Button
              mode="text"
              icon="calendar-edit"
              onPress={() => setShowPicker((v) => !v)}
              style={styles.changeButton}
              textColor={palette.primary}
            >
              {showPicker ? 'Done' : 'Change date'}
            </Button>

            {Platform.OS === 'ios' && showPicker ? (
              <DateTimePicker
                value={detectedDate}
                mode="date"
                display="compact"
                onChange={handleDatePicked}
                maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          loading={isSaving}
          disabled={isDetecting || isSaving}
          style={styles.confirmButton}
          contentStyle={styles.confirmContent}
          labelStyle={styles.confirmLabel}
        >
          Save to {MONTH_LABELS[detectedDate.getMonth()]} {detectedDate.getFullYear()}
        </Button>
      </View>

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={detectedDate}
          mode="date"
          display="default"
          onChange={handleDatePicked}
          maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  topTitle: { fontWeight: '700', fontSize: 16, color: palette.onSurface },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  previewWrapper: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: palette.surfaceVariant,
    aspectRatio: 3 / 4,
    maxHeight: 340,
  },
  preview: { width: '100%', height: '100%' },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  rescanButton: { borderColor: palette.primary, marginLeft: spacing.sm },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  titleInput: { backgroundColor: palette.white },
  titleHint: {
    fontSize: 11,
    color: palette.onSurfaceVariant,
    marginTop: -spacing.xs,
    marginLeft: spacing.sm,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  changeButton: { alignSelf: 'flex-start', marginLeft: -spacing.xs },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.outline,
  },
  confirmButton: { borderRadius: radii.lg, backgroundColor: palette.primary },
  confirmContent: { height: 56 },
  confirmLabel: { fontWeight: '700', fontSize: 16 },
});
