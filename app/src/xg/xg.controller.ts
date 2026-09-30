import { Controller, Post, Body } from '@nestjs/common';
import { XgService } from './xg.service.js';

@Controller('api/xg')
export class XgController {
  constructor(private readonly xgService: XgService) {}

  @Post('predict')
  async predict(@Body() shotData: any) {
    const xg = await this.xgService.predictWithPython(shotData);
    return { xg };
  }
}