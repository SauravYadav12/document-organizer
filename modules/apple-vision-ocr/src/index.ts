import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type AppleVisionOcrNative = {
  recognizeText(uri: string): Promise<string>;
};

const AppleVisionOcr = requireOptionalNativeModule<AppleVisionOcrNative>('AppleVisionOcr');

export function isAvailable(): boolean {
  return Platform.OS === 'ios' && AppleVisionOcr != null;
}

export async function recognizeText(uri: string): Promise<string> {
  if (!AppleVisionOcr) {
    throw new Error('AppleVisionOcr is not available on this platform.');
  }
  return AppleVisionOcr.recognizeText(uri);
}
