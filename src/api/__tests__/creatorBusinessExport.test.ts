import { filenameFromDisposition } from '../creatorBusiness';

describe('filenameFromDisposition', () => {
  it("reads the server's file name (RFC 6266 form first)", () => {
    expect(
      filenameFromDisposition(
        `attachment; filename="basetube-customers-2026-10-14-to-2026-11-12.csv"; filename*=UTF-8''basetube-customers-2026-10-14-to-2026-11-12.csv`,
      ),
    ).toBe('basetube-customers-2026-10-14-to-2026-11-12.csv');
    expect(filenameFromDisposition(`attachment; filename*=UTF-8''basetube-customers-all-time-to-2026-11-12.csv`)).toBe(
      'basetube-customers-all-time-to-2026-11-12.csv',
    );
    expect(filenameFromDisposition('attachment; filename=plain.csv')).toBe('plain.csv');
  });

  it('gives null when there is no name to read', () => {
    expect(filenameFromDisposition(undefined)).toBeNull();
    expect(filenameFromDisposition('attachment')).toBeNull();
  });
});
