import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    registerVolunteer: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    verifyOtp: jest.fn(),
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
    it('should call authService.register and return the result', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'pwd',
        ageRange: 'range_21_26' as any,
      };
      const expectedResult = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.register.mockResolvedValue(expectedResult as never);

      const result = await controller.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('registerVolunteer', () => {
    it('should call authService.registerVolunteer and return the result', async () => {
      const dto = { email: 'v@test.com', password: 'pwd', name: 'Volunteer' };
      const expectedResult = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.registerVolunteer.mockResolvedValue(
        expectedResult as never,
      );

      const result = await controller.registerVolunteer(dto);
      expect(mockAuthService.registerVolunteer).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto = { email: 'test@test.com', password: 'pwd' };
      const expectedResult = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.login.mockResolvedValue(expectedResult as never);

      const result = await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return the result', async () => {
      const dto = { refreshToken: 'rt' };
      const expectedResult = { accessToken: 'new-at', refreshToken: 'new-rt' };
      mockAuthService.refresh.mockResolvedValue(expectedResult as never);

      const result = await controller.refresh(dto);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the DTO and user ID', async () => {
      const dto = { refreshToken: 'rt' };
      mockAuthService.logout.mockResolvedValue({ message: 'Logged out' });

      await controller.logout(dto, 'acc-123');
      expect(mockAuthService.logout).toHaveBeenCalledWith(dto, 'acc-123');
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword and return the result', async () => {
      const dto = { email: 'forgot@test.com' };
      const expectedResult = {
        message: 'If an account exists, an OTP has been sent.',
      };
      mockAuthService.forgotPassword.mockResolvedValue(expectedResult as never);

      const result = await controller.forgotPassword(dto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with the DTO and return the result', async () => {
      const dto = { email: 'verify@test.com', otp: '123456' };
      const expectedResult = { resetToken: 'uuid-token' };
      mockAuthService.verifyOtp.mockResolvedValue(expectedResult as never);

      const result = await controller.verifyOtp(dto);
      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
