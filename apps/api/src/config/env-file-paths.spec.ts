import { existsSync } from 'fs';
import { join } from 'path';
import { getMonorepoEnvFilePaths } from './env-file-paths';

describe('getMonorepoEnvFilePaths', () => {
  it('resolves monorepo root from apps/api/src', () => {
    const paths = getMonorepoEnvFilePaths(join(process.cwd(), 'src'));
    expect(paths[0]).toMatch(/project-management\/\.env$/);
    expect(existsSync(paths[0])).toBe(true);
  });

  it('resolves monorepo root from apps/api/dist/src/config', () => {
    const paths = getMonorepoEnvFilePaths(join(process.cwd(), 'dist/src/config'));
    expect(paths[0]).toMatch(/project-management\/\.env$/);
    expect(existsSync(paths[0])).toBe(true);
  });
});
