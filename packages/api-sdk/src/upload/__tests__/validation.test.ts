import { classifyUploadFile, VIDEO_MAX_BYTES, validateFileSelection } from '../validation';

function file(name: string, size = 1_000, type = 'video/mp4'): File {
  return { name, size, type, lastModified: 1 } as unknown as File;
}

describe('classifyUploadFile', () => {
  it('accepts the three container families in contract 4', () => {
    expect(classifyUploadFile(file('a.mp4', 1_000, 'video/mp4'))).toMatchObject({
      contentType: 'video/mp4',
    });
    expect(classifyUploadFile(file('a.mov', 1_000, 'video/quicktime'))).toMatchObject({
      contentType: 'video/quicktime',
    });
    expect(classifyUploadFile(file('a.avi', 1_000, 'video/x-msvideo'))).toMatchObject({
      contentType: 'video/x-msvideo',
    });
  });

  it('accepts an empty declared type, which some browsers send', () => {
    expect(classifyUploadFile(file('a.mp4', 1_000, ''))).toMatchObject({ contentType: 'video/mp4' });
  });

  it('rejects a mismatch between the extension and the declared type', () => {
    expect(classifyUploadFile(file('a.mp4', 1_000, 'video/webm'))).toMatchObject({
      code: 'UNSUPPORTED_TYPE',
    });
  });

  it('rejects unsupported containers and empty files', () => {
    expect(classifyUploadFile(file('a.webm', 1_000, 'video/webm'))).toMatchObject({
      code: 'UNSUPPORTED_TYPE',
    });
    expect(classifyUploadFile(file('a.mp4', 0))).toMatchObject({ code: 'FILE_TOO_LARGE' });
  });

  it('rejects anything over the 2 GB ceiling', () => {
    expect(classifyUploadFile(file('a.mp4', VIDEO_MAX_BYTES + 1))).toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
    expect(classifyUploadFile(file('a.mp4', VIDEO_MAX_BYTES))).toMatchObject({
      contentType: 'video/mp4',
    });
  });

  it('rejects filenames with path separators or control characters', () => {
    expect(classifyUploadFile(file('dir/a.mp4'))).toMatchObject({ code: 'INVALID_FILENAME' });
    expect(classifyUploadFile(file('a.mp4'))).toMatchObject({ code: 'INVALID_FILENAME' });
  });
});

describe('validateFileSelection', () => {
  it('accepts up to the number of free slots and explains the rest', () => {
    const result = validateFileSelection([file('a.mp4'), file('b.mp4'), file('c.mp4')], 2);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]).toMatchObject({ code: 'QUEUE_FULL' });
  });

  it('names the session cap when that is the binding limit', () => {
    const result = validateFileSelection([file('a.mp4')], 0, 'session');
    expect(result.rejected[0]).toMatchObject({ code: 'SESSION_FULL' });
  });
});

/**
 * These sentences are read by a creator, not a developer, and they are kept
 * word-for-word in step with the web app's copy map
 * (`src/components/upload/uploadCopy.ts`). Pinning them here is what makes a
 * drift between the two a failing test rather than a support ticket.
 */
describe('rejection copy', () => {
  it('says what the file did wrong and what to choose instead', () => {
    expect(classifyUploadFile(file('a.webm', 1_000, 'video/webm'))).toMatchObject({
      message: 'We accept MP4, MOV and AVI files.',
    });
    expect(classifyUploadFile(file('a.mp4', VIDEO_MAX_BYTES + 1))).toMatchObject({
      message: 'This file is over the 2 GB limit.',
    });
    expect(classifyUploadFile(file('dir/a.mp4'))).toMatchObject({
      message: 'Rename the file without slashes or control characters.',
    });
  });

  it('says which cap is full and how to make room', () => {
    expect(validateFileSelection([file('a.mp4')], 0).rejected[0]).toMatchObject({
      message: 'The queue is full at 50 files. Let some finish, then add more.',
    });
    expect(validateFileSelection([file('a.mp4')], 0, 'session').rejected[0]).toMatchObject({
      message: 'This browser session is full at 200 files. Reload the page to start another.',
    });
  });

  it('never leaks a code as the message', () => {
    const rejected = [
      classifyUploadFile(file('a.webm', 1_000, 'video/webm')),
      classifyUploadFile(file('a.mp4', 0)),
      classifyUploadFile(file('dir/a.mp4')),
    ];
    for (const result of rejected) {
      expect(result).toHaveProperty('message');
      expect((result as { message: string }).message).not.toMatch(/[A-Z]{2,}_[A-Z]{2,}/);
    }
  });
});
