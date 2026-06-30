import { existsSync, readFileSync } from 'fs';
import { getMonorepoEnvFilePaths } from './env-file-paths';

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }
  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

/** Loads monorepo `.env` files into `process.env` before Nest/MikroORM bootstrap. */
export function loadMonorepoEnv(fromDirname = __dirname): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  for (const filePath of getMonorepoEnvFilePaths(fromDirname)) {
    if (!existsSync(filePath)) {
      continue;
    }
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }
      const [key, value] = parsed;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadMonorepoEnv();
