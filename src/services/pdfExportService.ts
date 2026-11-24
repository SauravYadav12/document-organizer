import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import type { DocumentRecord } from '../types/models';

/**
 * Previous attempts sized each `.page` as a hard 210×297mm box with
 * `@page { margin: 0 }`, but WKWebView's print formatter applies its own
 * printer margins on top of what the HTML asks for, so every page
 * overflowed by those margins and rendered as two sheets. Plus the image
 * header combined with an unbounded `img` could cause mid-image
 * pagination, splitting tall receipts across sheets.
 *
 * This template works WITH the print formatter: let the formatter set the
 * sheet size and apply its margins, then make each `.page` fill exactly
 * one viewport-height (`100vh` inside that margined area) and lock
 * `page-break-inside: avoid`. The image lives in a flex `.image-slot`
 * with `max-height: 100%` + `object-fit: contain`, which can't exceed the
 * row's share of the page.
 */
const PAGE_HTML_HEAD = `
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 10mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: -apple-system, system-ui, sans-serif; color: #0F172A; }
    .page {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 100vh;
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .page-header { flex: 0 0 auto; margin-bottom: 3mm; }
    .title { font-size: 13px; font-weight: 600; margin: 0 0 1mm 0; }
    .meta { font-size: 10px; color: #64748B; margin: 0; }
    .image-slot {
      flex: 1 1 0;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .image-slot img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .cover { align-items: center; justify-content: center; text-align: center; }
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
