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

/**
 * Builds a Moti timing transition. Typed as `any` because Moti's exported
 * `MotiTransitionProp` conflates a discriminated union with an index-signature
 * record, which rejects any plain literal — unrelated to runtime correctness.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timingTransition(duration: number, delay = 0, loop = false): any {
  const transition: Record<string, unknown> = { type: 'timing', duration };
  if (delay) transition.delay = delay;
  if (loop) transition.loop = true;
  return transition;
}
