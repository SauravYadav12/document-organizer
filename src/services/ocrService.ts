import { Platform } from 'react-native';
import * as AppleVisionOcr from 'apple-vision-ocr';

export type OcrResult = {
  text: string;
  engine: 'apple-vision' | 'ml-kit' | 'none';
};

export async function extractTextFromImage(imageUri: string): Promise<OcrResult> {
  if (AppleVisionOcr.isAvailable()) {
    try {
      const text = await AppleVisionOcr.recognizeText(imageUri);
      if (text && text.trim().length > 0) {
        return { text, engine: 'apple-vision' };
      }
    } catch {
      // fall through to platform fallback
    }
  }

  if (Platform.OS === 'android') {
    try {
      // Lazy-load so iOS (where this module is not linked) never evaluates it.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
      const result = await TextRecognition.recognize(imageUri);
      return { text: result?.text ?? '', engine: 'ml-kit' };
    } catch {
      return { text: '', engine: 'none' };
    }
  }

  return { text: '', engine: 'none' };
}
