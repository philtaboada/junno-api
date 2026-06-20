import {
  buildProjectIdsInFilter,
  buildWorkspaceFilter,
  buildWorkspaceSearchFilter,
} from './meilisearch-filter.utils';

describe('meilisearch-filter.utils', () => {
  it('builds workspace filter', () => {
    expect(buildWorkspaceFilter('ws-1')).toBe('workspaceId = "ws-1"');
  });

  it('builds project ids filter', () => {
    expect(buildProjectIdsInFilter('projectIds', ['p-1', 'p-2'])).toBe(
      'projectIds IN ["p-1", "p-2"]',
    );
  });

  it('builds empty project ids filter', () => {
    expect(buildProjectIdsInFilter('id', [])).toBe('id IN [""]');
  });

  it('combines workspace and project filters', () => {
    expect(
      buildWorkspaceSearchFilter('ws-1', ['p-1'], 'projectIds'),
    ).toBe('workspaceId = "ws-1" AND projectIds IN ["p-1"]');
  });
});
