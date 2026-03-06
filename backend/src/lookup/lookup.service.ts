import { Injectable } from '@nestjs/common';
import mockData from '../volunteer/mock-volunteer-data.json';

const masterSpecialisations = mockData.specialisations;

@Injectable()
export class LookupService {
  // GET /specialisations
  getSpecialisations() {
    return masterSpecialisations.map((s) => ({
      specialisationId: s.specialisationId,
      name: s.name,
      description: s.description,
    }));
  }
}
