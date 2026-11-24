import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_LONGEST_EDGE = 2000;
const STORAGE_JPEG_QUALITY = 0.8;

const ROOT_DIRECTORY = `${FileSystem.documentDirectory}docorg/`;
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
  await Promise.all([
    ensureDirectory(ROOT_DIRECTORY),
    ensureDirectory(DOCUMENTS_DIRECTORY),
    ensureDirectory(THUMBNAILS_DIRECTORY),
    ensureDirectory(TEMP_DIRECTORY),
  ]);
}

async function ensureDirectory(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export async function moveFile(fromUri: string, toUri: string): Promise<void> {
  await ensureDirectory(parentDirectoryOf(toUri));
  await FileSystem.moveAsync({ from: fromUri, to: toUri });
}

export async function copyFile(fromUri: string, toUri: string): Promise<void> {
  await ensureDirectory(parentDirectoryOf(toUri));
  await FileSystem.copyAsync({ from: fromUri, to: toUri });
}

export async function deleteFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export function parentDirectoryOf(uri: string): string {
  const lastSlash = uri.lastIndexOf('/');
  return lastSlash >= 0 ? uri.slice(0, lastSlash + 1) : uri;
}

export type CompressedImage = { uri: string; width: number; height: number };

/**
 * Resize the longest edge to MAX_LONGEST_EDGE and re-encode JPEG to keep
 * storage small while preserving readability for OCR/print.
 */
export async function compressForStorage(sourceUri: string): Promise<CompressedImage> {
  const probe = await manipulateAsync(sourceUri, [], { compress: 1, format: SaveFormat.JPEG });
  const longest = Math.max(probe.width, probe.height);
  const actions =
    longest > MAX_LONGEST_EDGE
      ? [{ resize: probe.width >= probe.height ? { width: MAX_LONGEST_EDGE } : { height: MAX_LONGEST_EDGE } }]
      : [];
  const result = await manipulateAsync(sourceUri, actions, {
    compress: STORAGE_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return { uri: result.uri, width: result.width, height: result.height };
}

export async function getFileSizeBytes(uri: string): Promise<number | null> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;
  return 'size' in info ? info.size ?? null : null;
}
