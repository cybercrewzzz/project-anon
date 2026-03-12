import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.account.findUnique({
      where: { email },
      include: {
        accountRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findById(accountId: string) {
    return this.prisma.account.findUnique({
      where: { accountId },
      include: {
        accountRoles: {
          include: { role: true },
        },
        accountLanguages: {
          include: { language: true },
        },
      },
    });
  }
}
