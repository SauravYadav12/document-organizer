import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

type Props = {
  year: number;
  documentCount: number;
  onPress: () => void;
};

function YearCardBase({ year, documentCount, onPress }: Props) {
  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.iconBubble}>
        <MaterialCommunityIcons name="folder" size={28} color={palette.primary} />
      </View>
      <Text style={styles.year}>{year}</Text>
      <Text style={styles.count}>
        {documentCount} {documentCount === 1 ? 'document' : 'documents'}
      </Text>
    </PressableScale>
  );
}

export const YearCard = memo(YearCardBase);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 2,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  year: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.onSurface,
    marginTop: spacing.sm,
  },
  count: {
    fontSize: 13,
    color: palette.onSurfaceVariant,
    fontWeight: '500',
  },
});
