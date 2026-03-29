import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LookupService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /specialisations
  async getSpecialisations() {
    return this.prisma.specialisation.findMany({
      select: {
        specialisationId: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // GET /categories
  async getCategories() {
    return this.prisma.category.findMany({
      select: {
        categoryId: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // GET /languages
  async getLanguages() {
    return this.prisma.language.findMany({
      select: {
        languageId: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
