import { isBackgroundWorkerEnabled } from './worker-env';

describe('isBackgroundWorkerEnabled', () => {
  it('should be disabled unless env is explicitly true', () => {
    const configService = {
      get: (key: string) => (key === 'AUTOMATION_WORKER_ENABLED' ? undefined : 'false'),
    };
    expect(isBackgroundWorkerEnabled(configService as never, 'AUTOMATION_WORKER_ENABLED')).toBe(
      false,
    );
  });

  it('should be enabled when env is true', () => {
    const configService = {
      get: () => 'true',
    };
    expect(isBackgroundWorkerEnabled(configService as never, 'INTEGRATIONS_WORKER_ENABLED')).toBe(
      true,
    );
  });
});
