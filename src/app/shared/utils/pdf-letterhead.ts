import jsPDF from 'jspdf';
import { environment } from '../../../environments/environment';

// Shared "official report" letterhead for every printable PDF in the app —
// company logo + name/address block + a colored title bar. Keeps every
// report (Budget, Site Fund, etc.) looking like one consistent, official
// document instead of each screen inventing its own header.

let cachedLogoDataUrl: string | null | undefined; // undefined = not attempted yet
let loadingPromise: Promise<string | null> | null = null;

export interface CompanyBranding {
  name: string;
  address: string;
  email: string;
  website: string;
}

const FALLBACK_BRANDING: CompanyBranding = {
  name: 'Company',
  address: '',
  email: '',
  website: '',
};

let cachedBranding: CompanyBranding | undefined;
let brandingPromise: Promise<CompanyBranding> | null = null;

/**
 * Company name / address / contact block for PDF headers, pulled once from
 * the DB-driven website settings (same source as the public site + Contact
 * page) instead of being hardcoded per tenant.
 */
export function loadCompanyBranding(): Promise<CompanyBranding> {
  if (cachedBranding !== undefined) return Promise.resolve(cachedBranding);
  if (brandingPromise) return brandingPromise;

  brandingPromise = fetch(`${environment.apiUrl}/public/settings`)
    .then((res) => res.json())
    .then((body) => {
      const d = body?.data || {};
      cachedBranding = {
        name: d.site_title || d.about_company_name || FALLBACK_BRANDING.name,
        address: d.contact_address || '',
        email: d.contact_email || '',
        website: d.site_url || d.contact_website || '',
      };
      return cachedBranding;
    })
    .catch(() => {
      cachedBranding = FALLBACK_BRANDING;
      return cachedBranding;
    });

  return brandingPromise;
}

/** Last-loaded branding, or the neutral fallback. Call loadCompanyBranding()
    (or loadCompanyLogo(), which warms it) beforehand for real values. */
export function getCompanyBrandingSync(): CompanyBranding {
  return cachedBranding || FALLBACK_BRANDING;
}

/** Fetches assets/img/logo.png once and caches it as a base64 data URL for jsPDF's addImage(). */
export function loadCompanyLogo(): Promise<string | null> {
  // Warm the DB branding cache alongside the logo, so a caller that does
  // `await loadCompanyLogo()` before drawLetterhead() gets the real
  // company name/address without every call site having to fetch it.
  loadCompanyBranding();

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

  // Resolve only once branding has also settled, so drawLetterhead() (called
  // synchronously right after the await) can read the cached company block.
  return Promise.all([loadingPromise, loadCompanyBranding()]).then(([logo]) => logo);
}

export interface LetterheadOptions {
  title: string;
  subtitle: string;
  logoDataUrl: string | null;
  barColor?: [number, number, number];
  /** DB-driven company block (from loadCompanyBranding()). Optional so
      existing callers keep working; falls back to a neutral placeholder. */
  branding?: CompanyBranding | null;
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

  const b = opts.branding || cachedBranding || FALLBACK_BRANDING;
  const line2 = [b.address, b.email].filter(Boolean).join('  |  ');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 220, 220);
  doc.text(b.name, pageWidth - marginX, 12, { align: 'right' });
  if (line2) doc.text(line2, pageWidth - marginX, 18, { align: 'right' });
  if (b.website) doc.text(b.website, pageWidth - marginX, 24, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  return 42;
}

/** Draws "Page X of Y" + a generated-by line on every page. Call once, after all content is placed. */
export function drawFooterOnAllPages(doc: jsPDF, brandName?: string): void {
  const name = brandName || cachedBranding?.name || FALLBACK_BRANDING.name;
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
    doc.text(`Official document — ${name}`, marginX, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }
}
