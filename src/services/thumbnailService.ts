import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { buildThumbnailPath, fileStoragePaths, moveFile } from './fileStorageService';
import * as FileSystem from 'expo-file-system/legacy';

const THUMBNAIL_WIDTH = 480;

export async function generateThumbnail(sourceUri: string, fileName: string): Promise<string> {
  const manipulated = await manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL_WIDTH } }],
    { compress: 0.7, format: SaveFormat.JPEG },
  );
  const targetPath = buildThumbnailPath(fileName);
  await ensureThumbnailDirectory();
  await moveFile(manipulated.uri, targetPath);
  return targetPath;
}

async function ensureThumbnailDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(fileStoragePaths.thumbs);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(fileStoragePaths.thumbs, { intermediates: true });
  }
}
