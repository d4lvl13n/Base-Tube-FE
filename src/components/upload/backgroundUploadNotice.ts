/**
 * The one thing a creator needs to know when they walk away mid-upload.
 *
 * The upload page hides the floating queue panel — the page *is* the queue —
 * so leaving the page is the moment the panel appears and the moment the
 * reassurance is worth saying. Once per session; after that it is noise.
 */

export const BACKGROUND_UPLOAD_NOTICE =
  'Uploads continue in the background. Track them in the panel at the bottom right.';

/** Session flag key. Session, not local: it is reassurance, not a preference. */
export const BACKGROUND_UPLOAD_NOTICE_KEY = 'basetube.uploads.backgroundNoticeShown';

/** Routes that show the queue inline and therefore hide the floating panel. */
export const UPLOAD_ROUTES: readonly string[] = [
  '/creator-hub/content-studio',
  '/creator-hub/upload',
];

export function isUploadRoute(pathname: string): boolean {
  return UPLOAD_ROUTES.some((route) => pathname.startsWith(route));
}

/** In-memory backstop for when sessionStorage is unavailable. */
let claimedInThisTab = false;

/** Test seam: forget the in-memory claim. */
export function resetBackgroundNoticeClaim(): void {
  claimedInThisTab = false;
}

/**
 * True the first time it is called in a browser session, false after that.
 *
 * Storage can be unavailable (private mode, blocked cookies), so the module
 * keeps its own flag too — the message is shown once either way.
 */
export function claimBackgroundNotice(): boolean {
  if (claimedInThisTab) return false;
  try {
    if (window.sessionStorage.getItem(BACKGROUND_UPLOAD_NOTICE_KEY) === 'true') {
      claimedInThisTab = true;
      return false;
    }
    window.sessionStorage.setItem(BACKGROUND_UPLOAD_NOTICE_KEY, 'true');
  } catch {
    // No storage: the in-memory flag below is the whole guarantee.
  }
  claimedInThisTab = true;
  return true;
}
