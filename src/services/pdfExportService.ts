import * as Print from 'expo-print';
import type { DocumentRecord } from '../types/models';

const PAGE_HTML_HEAD = `
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, system-ui, sans-serif; margin: 0; color: #0F172A; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .meta { font-size: 11px; color: #64748B; margin-bottom: 6mm; }
    .title { font-size: 14px; font-weight: 600; margin-bottom: 2mm; }
    img { max-width: 100%; max-height: 240mm; display: block; margin: 0 auto; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 250mm; }
    .cover h1 { font-size: 32px; color: #0F766E; margin: 0 0 6mm 0; }
    .cover p { color: #475569; }
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

export function buildPdfHtml({ title, documents }: BuildOptions): string {
  const cover = `
    <div class="page cover">
      <h1>${escapeHtml(title)}</h1>
      <p>${documents.length} document${documents.length === 1 ? '' : 's'}</p>
      <p>Exported from DocOrg · ${new Date().toLocaleDateString()}</p>
    </div>
  `;
  const pages = documents
    .map((doc) => {
      const dateLabel = formatDocumentDate(doc);
      const headingTitle = doc.title?.trim() || dateLabel;
      return `
        <div class="page">
          <div class="title">${escapeHtml(headingTitle)}</div>
          <div class="meta">${escapeHtml(dateLabel)}</div>
          <img src="${doc.filePath}" />
        </div>
      `;
    })
    .join('');
  return `<!doctype html><html><head>${PAGE_HTML_HEAD}</head><body>${cover}${pages}</body></html>`;
}

export async function buildPdfFromDocuments(options: BuildOptions): Promise<string> {
  const html = buildPdfHtml(options);
  const file = await Print.printToFileAsync({ html, base64: false });
  return file.uri;
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
