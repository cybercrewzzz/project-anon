import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.account.findUnique({
      where: { email },
      select: {
        accountId: true,
        email: true,
        nickname: true,
        name: true,
        ageRange: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        accountRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findById(accountId: string) {
    return this.prisma.account.findUnique({
      where: { accountId },
      select: {
        accountId: true,
        email: true,
        nickname: true,
        name: true,
        ageRange: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
