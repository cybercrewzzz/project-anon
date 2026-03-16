import { Test, TestingModule } from '@nestjs/testing';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';

describe('VolunteerController', () => {
  let controller: VolunteerController;
  let service: jest.Mocked<VolunteerService>;

  const ACCOUNT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

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
    it('delegates to service with accountId from CurrentUser', () => {
      void controller.getProfile(ACCOUNT_ID);
      expect(service.getProfile).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('calls service only once', () => {
      void controller.getProfile(ACCOUNT_ID);
      expect(service.getProfile).toHaveBeenCalledTimes(1);
    });
  });

  // ── Update Profile ─────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('delegates to service with accountId and update payload', () => {
      const body = {
        about: 'Updated about text',
        specialisationIds: ['spec-1', 'spec-2'],
      };
      void controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes undefined specialisationIds when not provided', () => {
      const body = {
        about: 'Updated about',
      };
      void controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes undefined about when not provided', () => {
      const body = {
        specialisationIds: ['spec-1'],
      };
      void controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes empty specialisationIds array', () => {
      const body = {
        specialisationIds: [],
      };
      void controller.updateProfile(ACCOUNT_ID, body);
      expect(service.updateProfile).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });
  });

  // ── Update Status ──────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('delegates to service with accountId and available status', () => {
      const body = {
        available: true,
      };
      void controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes available false', () => {
      const body = {
        available: false,
      };
      void controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('calls service exactly once', () => {
      const body = {
        available: true,
      };
      void controller.updateStatus(ACCOUNT_ID, body);
      expect(service.updateStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ── Apply as Volunteer ─────────────────────────────────────────────

  describe('applyAsVolunteer', () => {
    it('delegates to service with accountId and apply payload', () => {
      const body = {
        name: 'John Doe',
        instituteEmail: 'john@university.edu',
        instituteName: 'Test University',
        studentId: 'STU123',
        instituteIdImageUrl: 'https://example.com/id.jpg',
        grade: 'A+',
        about: 'Passionate volunteer',
        specialisationIds: ['spec-1', 'spec-2'],
      };
      void controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes payload without optional about field', () => {
      const body = {
        name: 'Jane Doe',
        instituteEmail: 'jane@university.edu',
        instituteName: 'Another University',
        studentId: 'STU124',
        instituteIdImageUrl: 'https://example.com/id2.jpg',
        grade: 'A',
        specialisationIds: ['spec-1'],
      };
      void controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('passes multiple specialisations', () => {
      const body = {
        name: 'Test User',
        instituteEmail: 'test@university.edu',
        instituteName: 'Test University',
        studentId: 'STU125',
        instituteIdImageUrl: 'https://example.com/id3.jpg',
        grade: 'B+',
        about: 'Test',
        specialisationIds: ['spec-1', 'spec-2', 'spec-3'],
      };
      void controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('delegates with single specialisation', () => {
      const body = {
        name: 'Single Spec User',
        instituteEmail: 'single@university.edu',
        instituteName: 'Test University',
        studentId: 'STU126',
        instituteIdImageUrl: 'https://example.com/id4.jpg',
        grade: 'A',
        specialisationIds: ['spec-1'],
      };
      void controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledWith(ACCOUNT_ID, body);
    });

    it('calls service exactly once', () => {
      const body = {
        name: 'John Doe',
        instituteEmail: 'john@university.edu',
        instituteName: 'Test University',
        studentId: 'STU123',
        instituteIdImageUrl: 'https://example.com/id.jpg',
        grade: 'A+',
        specialisationIds: ['spec-1'],
      };
      void controller.applyAsVolunteer(ACCOUNT_ID, body);
      expect(service.applyAsVolunteer).toHaveBeenCalledTimes(1);
    });
  });
});
