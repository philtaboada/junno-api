export const SEARCH_ENGINE_POSTGRES = 'postgres' as const;
export const SEARCH_ENGINE_MEILISEARCH = 'meilisearch' as const;

export type SearchEngine =
  | typeof SEARCH_ENGINE_POSTGRES
  | typeof SEARCH_ENGINE_MEILISEARCH;

export const SEARCH_INDEX_PROJECTS = 'junno_projects';
export const SEARCH_INDEX_TASKS = 'junno_tasks';
export const SEARCH_INDEX_COMMENTS = 'junno_comments';

export const SEARCH_RESULT_LIMIT = 10;
