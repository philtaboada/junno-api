import { isBackgroundWorkerEnabled } from './worker-env';

describe('isBackgroundWorkerEnabled', () => {
  it('should be enabled when REDIS_URL is set and env is unset', () => {
    const configService = {
      get: (key: string) => (key === 'REDIS_URL' ? 'redis://localhost:6379' : undefined),
    };
    expect(isBackgroundWorkerEnabled(configService as never, 'AUTOMATION_WORKER_ENABLED')).toBe(
      true,
    );
  });

  it('should be disabled when env is false', () => {
    const configService = {
      get: (key: string) => {
        if (key === 'AUTOMATION_WORKER_ENABLED') {
          return 'false';
        }
        return 'redis://localhost:6379';
      },
    };
    expect(isBackgroundWorkerEnabled(configService as never, 'AUTOMATION_WORKER_ENABLED')).toBe(
      false,
    );
  });

  it('should be disabled when REDIS_URL is missing', () => {
    const configService = {
      get: () => undefined,
    };
    expect(isBackgroundWorkerEnabled(configService as never, 'INTEGRATIONS_WORKER_ENABLED')).toBe(
      false,
    );
  });
});
