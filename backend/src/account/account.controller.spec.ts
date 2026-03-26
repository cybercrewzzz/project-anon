import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

describe('AccountController', () => {
  let controller: AccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  // Confirm the success message is returned to the caller
  it('should return a success message', () => {
  });


  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
