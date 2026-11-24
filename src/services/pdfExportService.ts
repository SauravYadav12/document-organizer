import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { Image as RNImage } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { DocumentRecord } from '../types/models';

/**
 * Pagination history (why every previous attempt failed):
 *
 * - `@page { margin: 0 }` + a hard 210x297mm `.page` box → WKWebView's
 *   print formatter applied its own margins and the page spilled onto a
 *   second sheet.
 * - `height: 100vh` → `vh` in WKWebView print context is the SCREEN
 *   viewport height, not the page.
 * - `max-height: 230mm` + `page-break-inside: avoid` on the parent → the
 *   formatter still auto-broke before/after large `<img>` elements.
 * - `page-break-after: always` on every `.page` → the formatter was
 *   emitting adjacent breaks, producing a blank page after each.
 *
 * The approach that finally held:
 *
 * 1. Resize each source JPEG to dimensions chosen so that at BOTH
 *    72 CSS-px-per-inch (treat px as pt) and 96 CSS-px-per-inch, the
 *    resulting natural size still fits inside A4's printable area. That
 *    removes any ambiguity about how WKWebView maps image pixels to
 *    inches in print context.
 * 2. Size the image with explicit `width` / `height` HTML attributes AND
 *    an inline `width: NNNmm; height: auto; max-height: NNNmm`. Physical
 *    mm units are deterministic; HTML attributes are presentation hints
 *    the formatter respects before any CSS pagination decision.
 * 3. Inline `style="page-break-before: always"` on every doc block except
 *    the first. No `page-break-after` anywhere. No `page-break-inside:
 *    avoid` — that was actively encouraging the formatter to defer the
 *    image to the next page and leave the current one blank.
 * 4. Mark the image with `page-break-before: avoid` so the formatter
 *    can't lift the image off its header onto its own page.
 */

// Chosen so that at either 72 or 96 CSS-px-per-inch, the image's natural
// size fits an A4 print page (190mm x 272mm content area at the formatter's
// usual ~10mm minimum).
//   520 px: 7.22" @ 72dpi = 183mm, 5.42" @ 96dpi = 138mm — both < 190mm
//   680 px: 9.44" @ 72dpi = 240mm (fits with margin to spare under 272mm)
const PDF_IMAGE_MAX_W = 520;
const PDF_IMAGE_MAX_H = 680;
const PDF_IMAGE_QUALITY = 0.82;

// Rendered size on the page — deterministic physical units. The image is
// constrained to this box via `object-fit: contain`.
const PAGE_IMAGE_WIDTH_MM = 170;
const PAGE_IMAGE_HEIGHT_MM = 220;

const PAGE_HTML_HEAD = `
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 15mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: -apple-system, system-ui, sans-serif; color: #0F172A; }
    .doc { }
    .doc .title { font-size: 13px; font-weight: 600; margin: 0 0 1mm 0; }
    .doc .meta { font-size: 10px; color: #64748B; margin: 0 0 3mm 0; }
    .doc .image-box {
      width: ${PAGE_IMAGE_WIDTH_MM}mm;
      height: ${PAGE_IMAGE_HEIGHT_MM}mm;
      margin: 0 auto;
      display: block;
      text-align: center;
      overflow: hidden;
    }
    .doc img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      display: inline-block;
      vertical-align: middle;
      page-break-before: avoid;
      break-before: avoid;
      page-break-after: avoid;
      break-after: avoid;
    }
    .cover { text-align: center; padding-top: 70mm; }
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
    ? `<div class="doc cover">
        <h1>${escapeHtml(title)}</h1>
        <p>${documents.length} documents</p>
        <p>Exported from DocOrg · ${new Date().toLocaleDateString()}</p>
      </div>`
    : '';

  const pages = embedded
    .map(({ document, imageSrc }, index) => {
      const dateLabel = formatDocumentDate(document);
      const headingTitle = document.title?.trim() || dateLabel;
      // First doc may share the cover's break context; every subsequent doc
      // must start on its own page. `page-break-before: always` on the
      // element itself is more deterministic than a `.doc + .doc` selector
      // when text nodes sit between siblings.
      const needsBreak = showCover || index > 0;
      const style = needsBreak
        ? 'page-break-before: always; break-before: page;'
        : '';
      return `<div class="doc" style="${style}">
        <div class="title">${escapeHtml(headingTitle)}</div>
        <div class="meta">${escapeHtml(dateLabel)}</div>
        <div class="image-box"><img src="${imageSrc}" /></div>
      </div>`;
    })
    .join('');
  return `<!doctype html><html><head>${PAGE_HTML_HEAD}</head><body>${cover}${pages}</body></html>`;
}

export async function buildPdfFromDocuments(options: BuildOptions): Promise<string> {
  const html = await buildPdfHtml(options);
  const file = await Print.printToFileAsync({ html, base64: false });
  return file.uri;
}

async function readImageAsDataUri(filePath: string): Promise<string> {
  try {
    const dims = await getImageDimensions(filePath);
    const resize = dims ? computePageFitResize(dims.width, dims.height) : null;
    const resized = await manipulateAsync(filePath, resize ? [{ resize }] : [], {
      compress: PDF_IMAGE_QUALITY,
      format: SaveFormat.JPEG,
    });
    const base64 = await new File(resized.uri).base64();
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return filePath;
  }
}

function computePageFitResize(
  width: number,
  height: number,
): { width: number } | { height: number } | null {
  const widthScale = PDF_IMAGE_MAX_W / width;
  const heightScale = PDF_IMAGE_MAX_H / height;
  const scale = Math.min(widthScale, heightScale);
  if (scale >= 1) return null;
  return widthScale <= heightScale
    ? { width: PDF_IMAGE_MAX_W }
    : { height: PDF_IMAGE_MAX_H };
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
