import {
  isWorkspaceSearchQueryEmpty,
  normalizeWorkspaceSearchQuery,
} from './workspace-search.utils';

describe('workspace-search.utils', () => {
  it('normalizes blank queries', () => {
    expect(normalizeWorkspaceSearchQuery('  hello  ')).toBe('hello');
    expect(normalizeWorkspaceSearchQuery(undefined)).toBe('');
  });

  it('detects empty search queries', () => {
    expect(isWorkspaceSearchQueryEmpty('')).toBe(true);
    expect(isWorkspaceSearchQueryEmpty('   ')).toBe(true);
    expect(isWorkspaceSearchQueryEmpty('task')).toBe(false);
  });
});
