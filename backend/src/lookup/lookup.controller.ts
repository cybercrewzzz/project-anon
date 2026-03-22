import { Controller, UseGuards, Get } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// RolesGuard is intentionally omitted — lookup endpoints are read-only reference
// data (specialisations, categories) that any authenticated user needs regardless
// of role, e.g. a user fetching specialisation options before applying.
@Controller('lookup')
@UseGuards(JwtAuthGuard)
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  // GET /specialisations
  @Get('specialisations')
  getSpecialisations() {
    return this.lookupService.getSpecialisations();
  }

  // GET /categories
  @Get('categories')
  getCategories() {
    return this.lookupService.getCategories();
  }

  // GET /languages
  @Get('languages')
  getLanguages() {
    return this.lookupService.getLanguages();
  }
}
