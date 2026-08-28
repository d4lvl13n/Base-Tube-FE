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
