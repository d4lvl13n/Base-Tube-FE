import {
  BACKGROUND_UPLOAD_NOTICE_KEY,
  claimBackgroundNotice,
  isUploadRoute,
  resetBackgroundNoticeClaim,
} from '../backgroundUploadNotice';

beforeEach(() => {
  window.sessionStorage.clear();
  resetBackgroundNoticeClaim();
});

describe('isUploadRoute', () => {
  it('covers both pages that render the queue inline', () => {
    expect(isUploadRoute('/creator-hub/content-studio')).toBe(true);
    expect(isUploadRoute('/creator-hub/upload')).toBe(true);
    // Nested paths belong to the same page.
    expect(isUploadRoute('/creator-hub/content-studio/anything')).toBe(true);
  });

  it('leaves the rest of the app alone', () => {
    expect(isUploadRoute('/creator-hub/videos')).toBe(false);
    expect(isUploadRoute('/')).toBe(false);
  });
});

describe('claimBackgroundNotice', () => {
  it('says yes once per session and no every time after', () => {
    expect(claimBackgroundNotice()).toBe(true);
    expect(claimBackgroundNotice()).toBe(false);
    expect(claimBackgroundNotice()).toBe(false);
    expect(window.sessionStorage.getItem(BACKGROUND_UPLOAD_NOTICE_KEY)).toBe('true');
  });

  it('honours a flag left by an earlier page load in the same session', () => {
    window.sessionStorage.setItem(BACKGROUND_UPLOAD_NOTICE_KEY, 'true');
    expect(claimBackgroundNotice()).toBe(false);
  });

  it('still shows the notice at most once when storage is unavailable', () => {
    const getItem = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage blocked');
      });

    expect(claimBackgroundNotice()).toBe(true);
    expect(claimBackgroundNotice()).toBe(false);

    getItem.mockRestore();
  });
});
