import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function findApiPackageRoot(fromDirname: string): string {
  let current = fromDirname;
  while (true) {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };
      if (packageJson.name === '@pm/api') {
        return current;
      }
    }
    const parent = join(current, '..');
    if (parent === current) {
      throw new Error('Could not locate @pm/api package root for env file loading.');
    }
    current = parent;
  }
}

/**
 * Paths to monorepo root env files, resolved from any compiled path under `apps/api`.
 */
export function getMonorepoEnvFilePaths(fromDirname: string): string[] {
  const apiRoot = findApiPackageRoot(fromDirname);
  const monorepoRoot = join(apiRoot, '..', '..');
  return [join(monorepoRoot, '.env'), join(monorepoRoot, '.env.local')];
}
