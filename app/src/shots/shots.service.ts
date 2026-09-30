import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const shot = await this.prisma.shot.findUnique({
      where: { id },
    });

    if (!shot) {
      throw new NotFoundException(`Strzał o ID "${id}" nie został znaleziony.`);
    }

    return shot;
  }
}