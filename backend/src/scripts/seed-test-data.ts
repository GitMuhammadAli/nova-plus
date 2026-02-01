/**
 * Script to seed test data for Phase 2 testing
 *
 * Usage:
 *   ts-node src/scripts/seed-test-data.ts
 *
 * Or via npm:
 *   npm run seed:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TestDataSeed } from '../modules/user/seed/test-data.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const testDataSeed = app.get(TestDataSeed);

  try {
    await testDataSeed.seedTestData();
    console.log('\n✅ Test data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
