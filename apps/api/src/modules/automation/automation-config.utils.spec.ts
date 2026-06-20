import { BadRequestException } from '@nestjs/common';
import { validateAutomationActionConfig } from './automation-config.utils';

describe('automation-config.utils', () => {
  it('validates assign_user config', () => {
    expect(
      validateAutomationActionConfig('assign_user', { userId: 'user-1' }),
    ).toEqual({ userId: 'user-1' });
  });

  it('rejects empty comment body', () => {
    expect(() =>
      validateAutomationActionConfig('add_comment', { body: '   ' }),
    ).toThrow(BadRequestException);
  });
});
