/**
 * Script to seed comprehensive bulk test data
 *
 * Creates:
 * - 1 Super Admin
 * - 3 Companies (AcmeCorp, TechVerse, GlobalSoft)
 * - 8-10 Users per company
 * - 4 Departments per company
 * - 3 Teams per company
 * - 5 Projects per company
 * - 8-12 Tasks per project
 * - 3 Workflows per company
 *
 * Usage:
 *   ts-node src/scripts/seed-bulk-data.ts
 *
 * Or via npm:
 *   npm run seed:bulk
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BulkSeedService } from '../modules/user/seed/bulk-seed.service';

async function bootstrap() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 NOVAPULSE BULK SEED DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const bulkSeedService = app.get(BulkSeedService);

  try {
    await bulkSeedService.seedBulkData();
    console.log('');
    console.log('✅ Bulk seed data completed successfully!');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Failed to seed bulk data:', error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
