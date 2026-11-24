import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { palette, spacing } from './theme';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <MotiView
        from={{ scale: 0.92, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ loop: true, type: 'timing', duration: 1800 }}
        style={styles.iconWrapper}
      >
        <MaterialCommunityIcons name={icon} size={64} color={palette.primary} />
      </MotiView>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: palette.onSurface,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
});
