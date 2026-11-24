module.exports = {
  dependencies: {
    // Apple Vision is the iOS OCR path (modules/apple-vision-ocr); ML Kit is
    // the Android fallback only. Excluding its iOS autolink drops the MLKit
    // pods that lack arm64-simulator slices and block iOS Simulator builds on
    // Apple Silicon Macs.
    '@react-native-ml-kit/text-recognition': {
      platforms: {
        ios: null,
      },
    },
  },
};
