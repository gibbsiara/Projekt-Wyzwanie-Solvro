import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ShotsModule } from './shots/shots.module.js';

@Module({
  imports: [PrismaModule, ShotsModule],
})
export class AppModule {}