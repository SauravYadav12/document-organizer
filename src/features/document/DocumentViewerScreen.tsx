import React, { useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { IconButton, Text } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFolderDocuments } from '../library/useLibraryData';
import { palette, spacing } from '../../ui/theme';
import type { LibraryStackParamList } from '../../navigation/screens';
import type { DocumentRecord } from '../../types/models';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export function DocumentViewerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'DocumentViewer'>>();
  const insets = useSafeAreaInsets();
  const { year, month, documentId } = route.params;

  const { documents } = useFolderDocuments(year, month);
  const listRef = useRef<FlatList<DocumentRecord>>(null);

  const initialIndex = useMemo(() => {
    const idx = documents.findIndex((d) => d.id === documentId);
    return idx >= 0 ? idx : 0;
  }, [documents, documentId]);

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / WINDOW_WIDTH);
    setCurrentIndex(idx);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DocumentRecord }) => (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        maximumZoomScale={4}
        minimumZoomScale={1}
        bouncesZoom
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <ExpoImage
          source={item.filePath}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </ScrollView>
    ),
    [],
  );

  if (documents.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={documents}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: WINDOW_WIDTH, offset: WINDOW_WIDTH * i, index: i })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton
          icon="close"
          iconColor={palette.white}
          size={26}
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {documents.length}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  page: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT, backgroundColor: '#000' },
  pageContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconButton: { backgroundColor: 'rgba(0,0,0,0.4)', margin: 0 },
  counterPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  counterText: { color: palette.white, fontSize: 13, fontWeight: '600' },
});
