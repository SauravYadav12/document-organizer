# DocOrg

A beautiful, on-device document organizer for iOS & Android. Capture a document, the app auto-detects its date and files it into a year → month folder. Reorganize, browse history, and share as PDF or ZIP — everything stays on your phone.

## Features

- Camera capture with on-device OCR (ML Kit) to auto-detect dates printed on documents.
- Smart fallback to today's date if no date is found, with an easy override.
- Year → month folder browsing with fast thumbnails (FlashList + expo-image).
- Move documents between year/month folders with one tap, and Undo via snackbar.
- Activity feed — every create, move, delete, share, and export is logged.
- Share a month or a single document as a **PDF** or **ZIP of originals** via the native share sheet.
- Local-first storage. No accounts, no servers, no cloud.

## Tech

Expo SDK 56 (managed) · TypeScript · React Navigation v7 · react-native-paper · react-native-reanimated v4 · @shopify/flash-list · expo-sqlite · expo-camera · `@react-native-ml-kit/text-recognition` · expo-print · react-native-zip-archive · zustand.

## Running locally

You need Xcode (for iOS) or Android Studio (for Android). DocOrg uses native modules, so **Expo Go won't work** — you must build the dev client.

```bash
# install deps (uses a project-local npm cache via .npmrc)
npm install

# regenerate app icons from assets/logo.svg
npm run build:icons

# build & run the dev client
npm run ios       # or: npm run android
```

After the first dev client install, you can iterate with `npm start` to launch the metro bundler.

## Project layout

```
src/
  navigation/    Root navigator + typed routes
  features/      One folder per feature (capture, library, document, history, share)
  db/            SQLite singleton + repositories
  services/      ocr / dateParser / fileStorage / thumbnail / pdfExport / zipExport
  stores/        Zustand store(s)
  ui/            Theme tokens, motion presets, shared UI primitives
  types/         Shared models
```

Each screen is a thin layout that delegates logic to a sibling `useXxx.ts` hook. DB SQL lives only in `src/db/`.

## License

MIT
