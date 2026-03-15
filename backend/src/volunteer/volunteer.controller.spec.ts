import { Test, TestingModule } from '@nestjs/testing';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';

describe('VolunteerController', () => {
  let controller: VolunteerController;
  let service: jest.Mocked<VolunteerService>;

  const ACCOUNT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const SPEC_ID_1 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const SPEC_ID_2 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const SPEC_ID_3 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<VolunteerService>> = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      updateStatus: jest.fn(),
      applyAsVolunteer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolunteerController],
      providers: [{ provide: VolunteerService, useValue: mockService }],
    }).compile();

    controller = module.get<VolunteerController>(VolunteerController);
    service = module.get(VolunteerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── Profile ────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('delegates to service with accountId from CurrentUser', async () => {
      await controller.getProfile(ACCOUNT_ID);
      expect(service.getProfile).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('calls service only once', async () => {
      await controller.getProfile(ACCOUNT_ID);
      expect(service.getProfile).toHaveBeenCalledTimes(1);
    });
  });

  // ── Update Profile ─────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('delegates to service with accountId and update payload', async () => {
      const body = {
        about: 'Updated about text',
        specialisationIds: [SPEC_ID_1, SPEC_ID_2],
      };
      await controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes undefined specialisationIds when not provided', async () => {
      const body = {
        about: 'Updated about',
      };
      await controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes undefined about when not provided', async () => {
      const body = {
        specialisationIds: [SPEC_ID_1],
      };
      await controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes empty specialisationIds array', async () => {
      const body = {
        specialisationIds: [],
      };
      await controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });
  });

  // ── Update Status ──────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('delegates to service with accountId and available status', async () => {
      const body = { available: true };
      await controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes available false', async () => {
      const body = { available: false };
      await controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('calls service exactly once', async () => {
      const body = { available: true };
      await controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ── Apply as Volunteer ─────────────────────────────────────────────

  describe('applyAsVolunteer', () => {
    it('delegates to service with accountId and apply payload', async () => {
      const body = {
        name: 'John Doe',
        instituteEmail: 'john@university.edu',
        instituteName: 'Test University',
        studentId: 'STU123',
        instituteIdImageUrl: 'https://example.com/id.jpg',
        grade: 'A+',
        about: 'Passionate volunteer',
        specialisationIds: [SPEC_ID_1, SPEC_ID_2],
      };
      await controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes payload without optional about field', async () => {
      const body = {
        name: 'Jane Doe',
        instituteEmail: 'jane@university.edu',
        instituteName: 'Another University',
        studentId: 'STU124',
        instituteIdImageUrl: 'https://example.com/id2.jpg',
        grade: 'A',
        specialisationIds: [SPEC_ID_1],
      };
      await controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes multiple specialisations', async () => {
      const body = {
        name: 'Test User',
        instituteEmail: 'test@university.edu',
        instituteName: 'Test University',
        studentId: 'STU125',
        instituteIdImageUrl: 'https://example.com/id3.jpg',
        grade: 'B+',
        about: 'Test',
        specialisationIds: [SPEC_ID_1, SPEC_ID_2, SPEC_ID_3],
      };
      await controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('delegates with single specialisation', async () => {
      const body = {
        name: 'Single Spec User',
        instituteEmail: 'single@university.edu',
        instituteName: 'Test University',
        studentId: 'STU126',
        instituteIdImageUrl: 'https://example.com/id4.jpg',
        grade: 'A',
        specialisationIds: [SPEC_ID_1],
      };
      await controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('calls service exactly once', async () => {
      const body = {
        name: 'John Doe',
        instituteEmail: 'john@university.edu',
        instituteName: 'Test University',
        studentId: 'STU123',
        instituteIdImageUrl: 'https://example.com/id.jpg',
        grade: 'A+',
        specialisationIds: [SPEC_ID_1],
      };
      await controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledTimes(1);
    });
  });
});
