import { Module, Global } from '@nestjs/common';
import { CircuitBreakerManager } from './circuit-breaker';

@Global()
@Module({
  providers: [CircuitBreakerManager],
  exports: [CircuitBreakerManager],
})
export class ResilienceModule {}

