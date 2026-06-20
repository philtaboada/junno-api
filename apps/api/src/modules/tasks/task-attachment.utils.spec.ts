import { isMissingUploadFile } from './task-attachment.utils';

describe('task-attachment.utils', () => {
  it('detects missing upload payloads', () => {
    expect(isMissingUploadFile(undefined)).toBe(true);
    expect(isMissingUploadFile(null)).toBe(true);
    expect(isMissingUploadFile({})).toBe(true);
    expect(isMissingUploadFile({ buffer: Buffer.from('x') })).toBe(false);
  });
});
