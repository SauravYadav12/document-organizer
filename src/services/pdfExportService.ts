import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import type { DocumentRecord } from '../types/models';

/**
 * The old template let the browser auto-paginate each `.page` div, which
 * caused tall receipts to split across two sheets (top half on one page,
 * bottom half on the next) and the forced `page-break-after` then added a
 * blank behind it. Every page now gets a hard A4 box, breaks are forbidden
 * inside it, and the image shrinks with `object-fit: contain` to fill the
 * remaining space between the header and the sheet edge. One document →
 * one page, every time.
 */
const PAGE_HTML_HEAD = `
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; color: #0F172A; }
    .page {
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      padding: 12mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .page:last-child { page-break-after: auto; }
    .page-header { flex: 0 0 auto; margin-bottom: 4mm; }
    .title { font-size: 14px; font-weight: 600; margin: 0 0 2mm 0; }
    .meta { font-size: 11px; color: #64748B; margin: 0; }
    .image-slot {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-slot img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }
    .cover { align-items: center; justify-content: center; text-align: center; }
    .cover h1 { font-size: 28px; color: #0F766E; margin: 0 0 6mm 0; }
    .cover p { color: #475569; margin: 2mm 0; font-size: 13px; }
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

  // Only include a cover when it earns its place: multi-document exports where
  // the caller named the pack. A single-doc PDF goes straight to the image.
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
          <div class="page-header">
            <div class="title">${escapeHtml(headingTitle)}</div>
            <div class="meta">${escapeHtml(dateLabel)}</div>
          </div>
          <div class="image-slot">
            <img src="${imageSrc}" />
          </div>
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
 * Embed images as `data:` URIs so the PDF is self-contained. `file://` URLs
 * worked in the on-device WKWebView but left receivers (WhatsApp, Mail, the
 * iOS share preview) unable to render the PDF — they saw a question mark
 * placeholder because the original paths don't exist in their sandbox.
 */
async function readImageAsDataUri(filePath: string): Promise<string> {
  try {
    const base64 = await new File(filePath).base64();
    const mime = inferMime(filePath);
    return `data:${mime};base64,${base64}`;
  } catch {
    // Fall back to the raw path; the PDF will miss that page's image but still open.
    return filePath;
  }
}

function inferMime(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
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
