import { Module } from '@nestjs/common';
import { ShotsController } from './shots.controller.js';
import { ShotsService } from './shots.service.js';

@Module({
  controllers: [ShotsController],
  providers: [ShotsService],
})
export class ShotsModule {}