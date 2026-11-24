import TextRecognition from '@react-native-ml-kit/text-recognition';
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
      // fall through to ML Kit
    }
  }

  try {
    const result = await TextRecognition.recognize(imageUri);
    return { text: result?.text ?? '', engine: 'ml-kit' };
  } catch {
    return { text: '', engine: 'none' };
  }
}
