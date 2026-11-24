import { Easing } from 'react-native-reanimated';

export const springs = {
  gentle: { damping: 18, stiffness: 180, mass: 1 },
  snappy: { damping: 14, stiffness: 320, mass: 1 },
  bouncy: { damping: 9, stiffness: 280, mass: 1 },
};

export const timings = {
  fast: { duration: 150, easing: Easing.out(Easing.cubic) },
  medium: { duration: 280, easing: Easing.out(Easing.cubic) },
  slow: { duration: 420, easing: Easing.out(Easing.cubic) },
};

export const staggerStep = 40;
