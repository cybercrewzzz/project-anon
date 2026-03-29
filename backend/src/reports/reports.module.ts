import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS MODULE
//
// Provides the POST /report endpoint for submitting abuse reports.
// PrismaModule is global (registered in AppModule) so we don't import it here.
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
