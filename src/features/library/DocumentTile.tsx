import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Image as ExpoImage } from 'expo-image';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

type Props = {
  thumbnailPath: string;
  documentDate: string;
  title: string | null;
  onPress: () => void;
};

function DocumentTileBase({ thumbnailPath, documentDate, title, onPress }: Props) {
  const trimmedTitle = title?.trim();
  return (
    <PressableScale onPress={onPress} style={styles.tile}>
      <ExpoImage
        source={thumbnailPath}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
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
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: palette.surfaceVariant,
  },
  caption: { padding: spacing.sm },
  title: { fontSize: 13, fontWeight: '600', color: palette.onSurface },
  date: { fontSize: 11, color: palette.onSurfaceVariant, marginTop: 2 },
});
