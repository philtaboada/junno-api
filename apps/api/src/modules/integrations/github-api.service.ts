import { BadRequestException, Injectable, Logger } from '@nestjs/common';

export type GitHubRepoOption = {
  readonly owner: string;
  readonly name: string;
  readonly fullName: string;
  readonly isPrivate: boolean;
};

type GitHubApiRepo = {
  readonly full_name?: string;
  readonly name?: string;
  readonly private?: boolean;
  readonly owner?: { readonly login?: string };
};

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);

  async listAccessibleRepos(accessToken: string): Promise<GitHubRepoOption[]> {
    const token = accessToken.trim();
    if (!token) {
      throw new BadRequestException('Token de GitHub requerido');
    }
    const repos: GitHubRepoOption[] = [];
    let page = 1;
    const maxPages = 5;

    while (page <= maxPages) {
      const url = new URL('https://api.github.com/user/repos');
      url.searchParams.set('affiliation', 'owner,organization_member,collaborator');
      url.searchParams.set('sort', 'updated');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(page));

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Junno-Integrations',
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException(
          'Token de GitHub inválido o sin permiso para listar repos',
        );
      }
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`GitHub list repos failed: ${response.status} ${errorText}`);
        throw new BadRequestException(`GitHub respondió ${response.status}`);
      }

      const payload = (await response.json()) as GitHubApiRepo[];
      if (payload.length === 0) {
        break;
      }

      for (const repo of payload) {
        const owner = repo.owner?.login?.trim();
        const name = repo.name?.trim();
        const fullName = repo.full_name?.trim();
        if (!owner || !name || !fullName) {
          continue;
        }
        repos.push({
          owner,
          name,
          fullName,
          isPrivate: Boolean(repo.private),
        });
      }

      if (payload.length < 100) {
        break;
      }
      page += 1;
    }

    repos.sort((left, right) => left.fullName.localeCompare(right.fullName));
    return repos;
  }
}
