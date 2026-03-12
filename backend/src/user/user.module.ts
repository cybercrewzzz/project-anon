import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UsersService } from './user.service.js';

@Module({
  providers: [UsersService],
  controllers: [UserController],
  exports: [UsersService],
})
export class UserModule {}
