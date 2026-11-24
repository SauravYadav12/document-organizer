import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { FAB, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';

import { YearCard } from './YearCard';
import { useYearList } from './useLibraryData';
import { EmptyState } from '../../ui/EmptyState';
import { palette, spacing } from '../../ui/theme';
import { staggerStep, timingTransition } from '../../ui/motion';
import { useEntitlement } from '../../subscription/useEntitlement';
import { SubscriptionBanner } from '../../subscription/SubscriptionBanner';
import type { YearSummary } from '../../types/models';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { years, isLoading } = useYearList();
  const { requireEntitlement } = useEntitlement();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="cog-outline"
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Settings"
        />
      ),
    });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: YearSummary; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={timingTransition(360, index * staggerStep)}
        style={styles.cell}
      >
        <YearCard
          year={item.year}
          documentCount={item.documentCount}
          onPress={() => navigation.navigate('Month', { year: item.year })}
        />
      </MotiView>
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={years}
        keyExtractor={(item) => String(item.year)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderItem}
        ListHeaderComponent={<SubscriptionBanner />}
        ListEmptyComponent={
          isLoading ? undefined : (
            <EmptyState
              icon="image-multiple-outline"
              title="No documents yet"
              subtitle="Tap the camera button to add your first document."
            />
          )
        }
      />
      <FAB
        icon="camera-plus"
        onPress={() => {
          if (!requireEntitlement()) return;
          navigation.navigate('CaptureTab', { screen: 'Capture' });
        }}
        style={styles.fab}
        color={palette.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  listContent: {
    padding: spacing.sm,
    flexGrow: 1,
  },
  cell: { flex: 1 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: palette.primary,
  },
});
