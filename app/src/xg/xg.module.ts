import { Module } from '@nestjs/common';
import { XgController } from './xg.controller.js';
import { XgService } from './xg.service.js';

@Module({
  controllers: [XgController],
  providers: [XgService],
})
export class XgModule {}