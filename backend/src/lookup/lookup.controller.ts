import { Controller, UseGuards, Get } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

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
}
