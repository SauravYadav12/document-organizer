import React, { useCallback } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';

import { ActivityRow } from './ActivityRow';
import { useActivityFeed } from './useActivityFeed';
import { EmptyState } from '../../ui/EmptyState';
import { palette, spacing } from '../../ui/theme';
import { staggerStep, timingTransition } from '../../ui/motion';
import type { ActivityRecord } from '../../types/models';

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { activities, isLoading } = useActivityFeed();

  const renderItem = useCallback(
    ({ item, index }: { item: ActivityRecord; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={timingTransition(240, Math.min(index, 10) * staggerStep)}
      >
        <ActivityRow
          activity={item}
          onPress={() => {
            if (item.documentId) {
              navigation.navigate('LibraryTab', {
                screen: 'DocumentDetail',
                params: { documentId: item.documentId },
              });
            }
          }}
        />
      </MotiView>
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? undefined : (
            <EmptyState
              icon="clock-outline"
              title="No activity yet"
              subtitle="Captures, moves and shares will show up here."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  listContent: { paddingVertical: spacing.md, flexGrow: 1 },
});
