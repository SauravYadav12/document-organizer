import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Directory } from 'expo-file-system';
import { buildThumbnailPath, fileStoragePaths, moveFile } from './fileStorageService';

const THUMBNAIL_WIDTH = 480;

export async function generateThumbnail(sourceUri: string, fileName: string): Promise<string> {
  const manipulated = await manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL_WIDTH } }],
    { compress: 0.7, format: SaveFormat.JPEG },
  );
  const targetPath = buildThumbnailPath(fileName);
  ensureThumbnailDirectory();
  await moveFile(manipulated.uri, targetPath);
  return targetPath;
}

function ensureThumbnailDirectory(): void {
  const dir = new Directory(fileStoragePaths.thumbs);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}
