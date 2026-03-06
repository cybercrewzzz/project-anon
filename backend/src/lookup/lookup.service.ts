import { Injectable } from '@nestjs/common';
import mockData from '../volunteer/mock-volunteer-data.json';

const masterSpecialisations = mockData.specialisations;
const masterCategories = mockData.categories;

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

  // GET /categories
  getCategories() {
    return masterCategories.map((c) => ({
      categoryID: c.categoryId,
      name: c.name,
      description: c.description,
    }));
  }
}
