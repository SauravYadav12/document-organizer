import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

type Props = {
  thumbnailPath: string;
  documentDate: string;
  title: string | null;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectable?: boolean;
};

function DocumentTileBase({
  thumbnailPath,
  documentDate,
  title,
  onPress,
  onLongPress,
  selected = false,
  selectable = false,
}: Props) {
  const trimmedTitle = title?.trim();
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tile, selected ? styles.tileSelected : null]}
    >
      <View style={styles.imageWrap}>
        <ExpoImage
          source={thumbnailPath}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
        {selectable ? (
          <View style={styles.checkOverlay}>
            <View style={[styles.checkCircle, selected ? styles.checkCircleOn : styles.checkCircleOff]}>
              {selected ? (
                <MaterialCommunityIcons name="check" size={16} color={palette.white} />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.caption}>
        <Text numberOfLines={1} style={styles.title}>
          {trimmedTitle || formatShortDate(documentDate)}
        </Text>
        {trimmedTitle ? (
          <Text style={styles.date}>{formatShortDate(documentDate)}</Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export const DocumentTile = memo(DocumentTileBase);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileSelected: { borderColor: palette.primary },
  imageWrap: { position: 'relative' },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: palette.surfaceVariant,
  },
  checkOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  checkCircleOff: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderColor: 'rgba(15,23,42,0.35)',
  },
  checkCircleOn: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  caption: { padding: spacing.sm },
  title: { fontSize: 13, fontWeight: '600', color: palette.onSurface },
  date: { fontSize: 11, color: palette.onSurfaceVariant, marginTop: 2 },
});
