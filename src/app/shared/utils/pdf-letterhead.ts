import jsPDF from 'jspdf';

// Shared "official report" letterhead for every printable PDF in the app —
// company logo + name/address block + a colored title bar. Keeps every
// report (Budget, Site Fund, etc.) looking like one consistent, official
// document instead of each screen inventing its own header.

let cachedLogoDataUrl: string | null | undefined; // undefined = not attempted yet
let loadingPromise: Promise<string | null> | null = null;

/** Fetches assets/img/logo.png once and caches it as a base64 data URL for jsPDF's addImage(). */
export function loadCompanyLogo(): Promise<string | null> {
  if (cachedLogoDataUrl !== undefined) return Promise.resolve(cachedLogoDataUrl);
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('assets/img/logo.png')
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    )
    .then((dataUrl) => {
      cachedLogoDataUrl = dataUrl;
      return dataUrl;
    })
    .catch(() => {
      cachedLogoDataUrl = null; // give up quietly — reports still work without the logo
      return null;
    });

  return loadingPromise;
}

export interface LetterheadOptions {
  title: string;
  subtitle: string;
  logoDataUrl: string | null;
  barColor?: [number, number, number];
}

/**
 * Draws the official letterhead at the top of the current page and returns
 * the Y coordinate where the caller should start placing content.
 */
export function drawLetterhead(doc: jsPDF, opts: LetterheadOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const barColor = opts.barColor || [17, 24, 39];

  // Header band
  doc.setFillColor(...barColor);
  doc.rect(0, 0, pageWidth, 32, 'F');

  if (opts.logoDataUrl) {
    try {
      doc.addImage(opts.logoDataUrl, 'PNG', marginX, 4, 24, 24);
    } catch (e) {
      // corrupt/unsupported image — skip silently, text header still renders
    }
  }

  const textX = opts.logoDataUrl ? marginX + 30 : marginX;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, textX, 15);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(opts.subtitle, textX, 22);

  doc.setFontSize(7.5);
  doc.setTextColor(220, 220, 220);
  doc.text('United Ram Construction Company Limited', pageWidth - marginX, 12, { align: 'right' });
  doc.text('P.O. Box, Zanzibar, Tanzania  |  info@unitedram.com', pageWidth - marginX, 18, { align: 'right' });
  doc.text('www.unitedram.com', pageWidth - marginX, 24, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  return 42;
}

/** Draws "Page X of Y" + a generated-by line on every page. Call once, after all content is placed. */
export function drawFooterOnAllPages(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const pageCount = (doc as any).internal.getNumberOfPages
    ? (doc as any).internal.getNumberOfPages()
    : (doc as any).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('Official document — United Ram Construction Company Limited', marginX, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }
}
