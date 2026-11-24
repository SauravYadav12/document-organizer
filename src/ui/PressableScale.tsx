import React from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springs } from './motion';

type Props = PressableProps & {
  children: React.ReactNode;
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function PressableScale({
  children,
  pressedScale = 0.97,
  style,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.value = withSpring(pressedScale, springs.snappy);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, springs.snappy);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) {
          Haptics.selectionAsync().catch(() => {});
        }
        onPress?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
