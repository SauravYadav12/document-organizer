import React from 'react';
import { Snackbar } from 'react-native-paper';
import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

type SnackKind = 'success' | 'error' | 'info';

type SnackItem = {
  message: string;
  kind: SnackKind;
  actionLabel?: string;
  onActionPress?: () => void;
};

type SnackState = {
  visible: boolean;
  current: SnackItem | null;
  show: (item: SnackItem) => void;
  hide: () => void;
};

export const useSnackbar = create<SnackState>((set) => ({
  visible: false,
  current: null,
  show: (item) => {
    if (item.kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (item.kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    set({ visible: true, current: item });
  },
  hide: () => set({ visible: false }),
}));

export function SnackbarHost() {
  const visible = useSnackbar((s) => s.visible);
  const current = useSnackbar((s) => s.current);
  const hide = useSnackbar((s) => s.hide);

  return (
    <Snackbar
      visible={visible}
      onDismiss={hide}
      duration={3500}
      action={
        current?.actionLabel && current?.onActionPress
          ? {
              label: current.actionLabel,
              onPress: () => {
                current.onActionPress?.();
                hide();
              },
            }
          : undefined
      }
    >
      {current?.message ?? ''}
    </Snackbar>
  );
}
