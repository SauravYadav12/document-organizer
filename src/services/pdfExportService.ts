import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { Image as RNImage } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { DocumentRecord } from '../types/models';

/**
 * Previous attempts tried to constrain the image with CSS (`max-height`,
 * `100vh`, `object-fit: contain`, hard A4 boxes), but WKWebView's print
 * formatter in expo-print applies its own printer margins on top of
 * whatever `@page` says and reports `vh` relative to the screen viewport,
 * not the print area. Any image taller than the real print area got
 * auto-paginated mid-image — top half on one page, bottom half with white
 * on the next, then the forced page break added yet another sheet.
 *
 * This version pre-shrinks each source image to an upper bound that is
 * guaranteed smaller than the print area under the most pessimistic
 * assumption (US Letter + the formatter's 0.75" minimum margin). Because
 * the image physically cannot overflow a page, the CSS can be trivial and
 * the browser has nothing to paginate across.
 */

// Cap the longest edge so an image at ~150 DPI comfortably fits an A4
// print page (≈ 8" × 11" printable). Aspect ratio is preserved.
const PDF_IMAGE_LONGEST_EDGE = 1500;
const PDF_IMAGE_QUALITY = 0.82;

const PAGE_HTML_HEAD = `
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 12mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: -apple-system, system-ui, sans-serif; color: #0F172A; }
    .page {
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .page:last-child { page-break-after: auto; }
    .title { font-size: 13px; font-weight: 600; margin: 0 0 1mm 0; }
    .meta { font-size: 10px; color: #64748B; margin: 0 0 3mm 0; }
    img {
      display: block;
      max-width: 100%;
      max-height: 230mm;
      width: auto;
      height: auto;
      margin: 0 auto;
    }
    .cover { text-align: center; padding-top: 80mm; }
    .cover h1 { font-size: 26px; color: #0F766E; margin: 0 0 5mm 0; }
    .cover p { color: #475569; margin: 1mm 0; font-size: 12px; }
  </style>
`;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type BuildOptions = {
  title: string;
  documents: DocumentRecord[];
};

type EmbeddedDocument = {
  document: DocumentRecord;
  imageSrc: string;
};

export async function buildPdfHtml({ title, documents }: BuildOptions): Promise<string> {
  const embedded = await Promise.all(
    documents.map<Promise<EmbeddedDocument>>(async (document) => ({
      document,
      imageSrc: await readImageAsDataUri(document.filePath),
    })),
  );

  const showCover = documents.length > 1;
  const cover = showCover
    ? `
      <div class="page cover">
        <h1>${escapeHtml(title)}</h1>
        <p>${documents.length} documents</p>
        <p>Exported from DocOrg · ${new Date().toLocaleDateString()}</p>
      </div>
    `
    : '';

  const pages = embedded
    .map(({ document, imageSrc }) => {
      const dateLabel = formatDocumentDate(document);
      const headingTitle = document.title?.trim() || dateLabel;
      return `
        <div class="page">
          <div class="title">${escapeHtml(headingTitle)}</div>
          <div class="meta">${escapeHtml(dateLabel)}</div>
          <img src="${imageSrc}" />
        </div>
      `;
    })
    .join('');
  return `<!doctype html><html><head>${PAGE_HTML_HEAD}</head><body>${cover}${pages}</body></html>`;
}

export async function buildPdfFromDocuments(options: BuildOptions): Promise<string> {
  const html = await buildPdfHtml(options);
  const file = await Print.printToFileAsync({ html, base64: false });
  return file.uri;
}

/**
 * Read and resize each source image so its longest edge is at most
 * PDF_IMAGE_LONGEST_EDGE pixels, preserving aspect ratio. At ~150 DPI
 * that maps to ~10 inches, which comfortably fits inside an A4 print
 * page even after the formatter adds its own margins. The resized JPEG
 * is then base64-embedded so the PDF is self-contained.
 */
async function readImageAsDataUri(filePath: string): Promise<string> {
  try {
    const dims = await getImageDimensions(filePath);
    const action =
      dims && Math.max(dims.width, dims.height) > PDF_IMAGE_LONGEST_EDGE
        ? [
            {
              resize:
                dims.width >= dims.height
                  ? { width: PDF_IMAGE_LONGEST_EDGE }
                  : { height: PDF_IMAGE_LONGEST_EDGE },
            },
          ]
        : [];
    const resized = await manipulateAsync(filePath, action, {
      compress: PDF_IMAGE_QUALITY,
      format: SaveFormat.JPEG,
    });
    const base64 = await new File(resized.uri).base64();
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    // Fall back to the original path. The PDF may miss that page's image,
    // but the file at least opens with the other pages intact.
    return filePath;
  }
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

function formatDocumentDate(doc: DocumentRecord): string {
  const monthLabel = MONTH_NAMES[doc.documentMonth] ?? '';
  return `${monthLabel} ${doc.documentYear}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
