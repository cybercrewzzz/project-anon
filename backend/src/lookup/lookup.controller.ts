import { Controller, UseGuards, Get } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller() //lookup
@UseGuards(AuthGuard)
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  // GET /specialisations

  @Get('specialisations')
  getSpecialisations() {
    return this.lookupService.getSpecialisations();
  }
}
