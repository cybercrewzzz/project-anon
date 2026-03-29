import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

describe('AccountController', () => {
  let controller: AccountController;

  const mockAccountService = {
    getMe: jest.fn(),
    updateMe: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: mockAccountService }],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('calls accountService.getMe with accountId and returns result', async () => {
      const accountId = 'user-id-123';
      const expected = { accountId, email: 'test@example.com' };
      mockAccountService.getMe.mockResolvedValue(expected);

      const result = await controller.getMe(accountId);

      expect(mockAccountService.getMe).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(expected);
    });
  });

  describe('updateMe', () => {
    it('calls accountService.updateMe with accountId and dto, returns result', async () => {
      const accountId = 'user-id-123';
      const dto = { name: 'New Name', languageIds: ['lang-1'] };
      const expected = { accountId, name: 'New Name' };
      mockAccountService.updateMe.mockResolvedValue(expected);

      const result = await controller.updateMe(accountId, dto);

      expect(mockAccountService.updateMe).toHaveBeenCalledWith(accountId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('changePassword', () => {
    it('calls accountService.changePassword with accountId and dto, returns result', async () => {
      const accountId = 'user-id-123';
      const dto = {
        currentPassword: 'oldPass123',
        newPassword: 'newPass456!',
      };
      const expected = { message: 'Password changed successfully' };
      mockAccountService.changePassword.mockResolvedValue(expected);

      const result = await controller.changePassword(accountId, dto);

      expect(mockAccountService.changePassword).toHaveBeenCalledWith(
        accountId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });
});
