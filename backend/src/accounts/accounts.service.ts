// EXAMPLE

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account } from '../generated/prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Account[]> {
    return this.prisma.account.findMany();
  }
}
