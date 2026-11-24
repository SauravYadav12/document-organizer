import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { PressableScale } from '../../ui/PressableScale';
import { palette } from '../../ui/theme';

type Props = {
  onPress: () => void;
  pulsing?: boolean;
  disabled?: boolean;
};

export function ShutterButton({ onPress, pulsing = false, disabled }: Props) {
  const innerScale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.8);

  React.useEffect(() => {
    if (pulsing) {
      ringScale.value = withRepeat(
        withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      ringOpacity.value = withRepeat(
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      ringScale.value = withTiming(1);
      ringOpacity.value = withTiming(0.8);
    }
  }, [pulsing, ringScale, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  return (
    <View style={styles.wrapper} pointerEvents={disabled ? 'none' : 'auto'}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <PressableScale
        pressedScale={0.92}
        onPress={() => {
          innerScale.value = withSequence(
            withTiming(0.85, { duration: 80 }),
            withTiming(1, { duration: 120 }),
          );
          onPress();
        }}
      >
        <Animated.View style={[styles.inner, innerStyle]} />
      </PressableScale>
    </View>
  );
}

const SIZE = 84;

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE + 24,
    height: SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE + 24,
    height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    borderWidth: 4,
    borderColor: palette.white,
  },
  inner: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: palette.white,
    borderWidth: 4,
    borderColor: palette.primary,
  },
});
