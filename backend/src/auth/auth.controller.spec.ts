import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AgeRangeEnum } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    registerVolunteer: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with the DTO and return the result', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'pwd',
        ageRange: AgeRangeEnum.RANGE_21_26,
      };
      const expectedResult = {
        accessToken: 'access',
        refreshToken: 'refresh',
        account: {},
      };
      mockAuthService.register.mockResolvedValue(expectedResult as never);

      const result = await controller.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('registerVolunteer', () => {
    it('should call authService.registerVolunteer with the DTO and return the result', async () => {
      const dto = { email: 'vol@test.com', password: 'pwd', name: 'Vol' };
      const expectedResult = {
        accessToken: 'access',
        refreshToken: 'refresh',
        account: {},
      };
      mockAuthService.registerVolunteer.mockResolvedValue(
        expectedResult as never,
      );

      const result = await controller.registerVolunteer(dto);
      expect(mockAuthService.registerVolunteer).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the DTO and return the result', async () => {
      const dto = { email: 'login@test.com', password: 'pwd' };
      const expectedResult = {
        accessToken: 'a',
        refreshToken: 'r',
        account: {},
      };
      mockAuthService.login.mockResolvedValue(expectedResult as never);

      const result = await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with the DTO and return the result', async () => {
      const dto = { refreshToken: 'old-refresh' };
      const expectedResult = { accessToken: 'new-a', refreshToken: 'new-r' };
      mockAuthService.refresh.mockResolvedValue(expectedResult as never);

      const result = await controller.refresh(dto);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the DTO and accountId, returning the result', async () => {
      const dto = { refreshToken: 'refresh-to-revoke' };
      const accountId = 'user-id-123';
      const expectedResult = { message: 'Logged out' };
      mockAuthService.logout.mockResolvedValue(expectedResult as never);

      const result = await controller.logout(dto, accountId);
      expect(mockAuthService.logout).toHaveBeenCalledWith(dto, accountId);
      expect(result).toEqual(expectedResult);
    });
  });
});
