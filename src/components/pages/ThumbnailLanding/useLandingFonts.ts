import { useEffect } from 'react';

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wdth,wght@62..125,400..900&display=swap';

/** Loads the landing page's two typefaces once (Archivo with its width axis, Anton for the big quote marks). */
export function useLandingFonts(): void {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    for (const [rel, href, cross] of [
      ['preconnect', 'https://fonts.googleapis.com', false],
      ['preconnect', 'https://fonts.gstatic.com', true],
    ] as const) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (cross) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = FONT_HREF;
    document.head.appendChild(sheet);
  }, []);
}
