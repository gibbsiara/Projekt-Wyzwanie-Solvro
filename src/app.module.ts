import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ShotsModule } from './shots/shots.module.js';
import { XgModule } from './xg/xg.module.js';

@Module({
  imports: [PrismaModule, ShotsModule, XgModule,],
})
export class AppModule {}