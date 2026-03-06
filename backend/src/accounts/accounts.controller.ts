import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from '../generated/prisma/client';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }
}
