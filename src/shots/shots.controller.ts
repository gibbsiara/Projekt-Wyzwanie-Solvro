import { Controller, Get, Param } from '@nestjs/common';
import { ShotsService } from './shots.service.js';

@Controller('shots')
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  @Get(':id')
  async getShotById(@Param('id') id: string) {
    return this.shotsService.findOne(id);
  }
}