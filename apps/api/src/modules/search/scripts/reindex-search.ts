import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { MeilisearchService } from '../meilisearch.service';
import { SearchIndexerService } from '../search-indexer.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const meilisearchService = app.get(MeilisearchService);
    if (!meilisearchService.isAvailable()) {
      throw new Error(
        'Meilisearch is not available. Set SEARCH_ENGINE=meilisearch, MEILI_URL and start Meilisearch.',
      );
    }
    const searchIndexerService = app.get(SearchIndexerService);
    await searchIndexerService.reindexAllWorkspaces();
    console.log('Search reindex completed');
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
