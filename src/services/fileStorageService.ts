import { Directory, File, Paths } from 'expo-file-system';
import { Image as RNImage } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_LONGEST_EDGE = 2000;
const STORAGE_JPEG_QUALITY = 0.8;

const ROOT_DIRECTORY = `${Paths.document.uri}docorg/`;
const DOCUMENTS_DIRECTORY = `${ROOT_DIRECTORY}docs/`;
const THUMBNAILS_DIRECTORY = `${ROOT_DIRECTORY}thumbs/`;
const TEMP_DIRECTORY = `${ROOT_DIRECTORY}tmp/`;

export const fileStoragePaths = {
  root: ROOT_DIRECTORY,
  docs: DOCUMENTS_DIRECTORY,
  thumbs: THUMBNAILS_DIRECTORY,
  temp: TEMP_DIRECTORY,
};

export function buildDocumentDirectory(year: number, month: number): string {
  return `${DOCUMENTS_DIRECTORY}${year}/${String(month).padStart(2, '0')}/`;
}

export function buildDocumentPath(year: number, month: number, fileName: string): string {
  return `${buildDocumentDirectory(year, month)}${fileName}`;
}

export function buildThumbnailPath(fileName: string): string {
  return `${THUMBNAILS_DIRECTORY}${fileName}`;
}

export function generateDocumentFileName(extension = 'jpg'): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${extension}`;
}

export async function ensureStorageReady(): Promise<void> {
  ensureDirectory(ROOT_DIRECTORY);
  ensureDirectory(DOCUMENTS_DIRECTORY);
  ensureDirectory(THUMBNAILS_DIRECTORY);
  ensureDirectory(TEMP_DIRECTORY);
}

function ensureDirectory(uri: string): void {
  const dir = new Directory(uri);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

export async function moveFile(fromUri: string, toUri: string): Promise<void> {
  ensureDirectory(parentDirectoryOf(toUri));
  await new File(fromUri).move(new File(toUri));
}

export async function copyFile(fromUri: string, toUri: string): Promise<void> {
  ensureDirectory(parentDirectoryOf(toUri));
  await new File(fromUri).copy(new File(toUri));
}

export async function deleteFile(uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}

export function parentDirectoryOf(uri: string): string {
  const lastSlash = uri.lastIndexOf('/');
  return lastSlash >= 0 ? uri.slice(0, lastSlash + 1) : uri;
}

export type CompressedImage = { uri: string; width: number; height: number };

/**
 * Resize the longest edge to MAX_LONGEST_EDGE and re-encode JPEG to keep
 * storage small while preserving readability for OCR/print. The source
 * dimensions are probed with Image.getSize (metadata-only) to avoid the
 * extra full-image decode a `manipulateAsync` probe would cost.
 */
export async function compressForStorage(sourceUri: string): Promise<CompressedImage> {
  const dims = await getImageDimensions(sourceUri);
  const actions =
    dims && Math.max(dims.width, dims.height) > MAX_LONGEST_EDGE
      ? [{ resize: dims.width >= dims.height ? { width: MAX_LONGEST_EDGE } : { height: MAX_LONGEST_EDGE } }]
      : [];
  const result = await manipulateAsync(sourceUri, actions, {
    compress: STORAGE_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return { uri: result.uri, width: result.width, height: result.height };
}

function getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

export async function getFileSizeBytes(uri: string): Promise<number | null> {
  const file = new File(uri);
  if (!file.exists) return null;
  return file.size ?? null;
}
